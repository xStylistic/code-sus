import { Player } from "./Player.js";
import { Role } from "./Role.js";
import { Task } from "./Task.js";
import { Sabotage } from "./Sabotage.js";
import { MeetingManager } from "./MeetingManager.js";
import { cloneTaskTemplates } from "../data/taskTemplates.js";
import { pickRandomLayout } from "../data/mapLayouts.js";
import { evaluateTaskCode } from "../game/taskRunner.js";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "../data/languages.js";

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 3;
const MAP_BOUNDS = { width: 640, height: 420 };
const INTERACTION_RADIUS = 90;
const BLACKOUT_COOLDOWN_MS = 10000;

export class GameRoom {
  constructor(roomId, hostSocketId, hostName, preferredLanguage = "javascript") {
    this.roomId = roomId;
    this.players = new Map();
    this.hostId = hostSocketId;
    this.selectedLanguage = preferredLanguage;
    this.state = "lobby";
    this.tasks = [];
    this.sharedTaskCode = {};
    this.taskEditors = {};
    this.taskCursors = {};
    this.taskProgress = 0;
    this.meeting = null;
    this.activeSabotage = null;
    this.blackoutCooldownUntil = 0;
    this.corruptedTaskId = null;
    this.disruption = 0;
    this.winner = null;
    this.statusText = "Waiting for players";
    this.scheduledActions = new Set();
    this.meetingTimer = null;

    this.addPlayer(hostSocketId, hostName, true, preferredLanguage);
    // mapLayout is chosen fresh at startGame() each match
    this.mapLayout = null;
  }

  addPlayer(socketId, name, isHost = false, preferredLanguage = "javascript") {
    if (this.players.size >= MAX_PLAYERS || this.state !== "lobby") {
      return { ok: false, error: "Room is full or already started." };
    }

    const player = new Player({ id: socketId, name, isHost, preferredLanguage: this.selectedLanguage });
    this.players.set(socketId, player);
    return { ok: true, player };
  }

  removePlayer(socketId) {
    const removed = this.players.get(socketId);
    this.players.delete(socketId);

    if (removed) {
      for (const taskId of Object.keys(this.taskEditors)) {
        this.taskEditors[taskId] = this.taskEditors[taskId].filter((name) => name !== removed.name);
      }

      for (const taskId of Object.keys(this.taskCursors)) {
        delete this.taskCursors[taskId]?.[socketId];
      }
    }

    if (removed?.isHost) {
      const nextHost = this.players.values().next().value;
      if (nextHost) {
        nextHost.isHost = true;
        this.hostId = nextHost.id;
      }
    }

    if (this.meeting && removed) {
      this.meeting.voteManager.removeVoter(socketId);
      if (this.meeting.voteManager.allVotesIn()) {
        this.finalizeMeeting();
      }
    }

    if (this.state === "in_game" && !this.winner) {
      this.evaluateWinConditions();
    }
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  setReady(socketId, isReady) {
    const player = this.players.get(socketId);
    if (!player || this.state !== "lobby") {
      return false;
    }

    player.isReady = isReady;
    return true;
  }

  setPlayerLanguage(socketId, language) {
    const player = this.players.get(socketId);
    if (!player || this.state !== "lobby" || socketId !== this.hostId) {
      return false;
    }

    this.selectedLanguage = language;
    for (const member of this.players.values()) {
      member.setPreferredLanguage(language);
    }
    return true;
  }

  canStart(socketId) {
    if (socketId !== this.hostId) {
      return { ok: false, error: "Only the host can start the match." };
    }

    if (this.players.size < MIN_PLAYERS) {
      return { ok: false, error: "At least 3 players are required." };
    }

    const allReady = [...this.players.values()].every((player) => player.isReady || player.isHost);
    if (!allReady) {
      return { ok: false, error: "Every player must be ready before the match starts." };
    }

    return { ok: true };
  }

  startGame() {
    this.clearMeetingTimer();
    this.state = "in_game";
    this.winner = null;
    this.statusText = "Complete tasks and watch for sabotage";
    this.taskProgress = 0;
    this.disruption = 0;
    this.meeting = null;
    this.activeSabotage = null;
    this.blackoutCooldownUntil = 0;
    this.corruptedTaskId = null;
    this.tasks = cloneTaskTemplates().map((taskTemplate) => new Task(taskTemplate));
    this.sharedTaskCode = {};
    this.taskEditors = {};
    this.taskCursors = {};

    // Pick a fresh random map layout for this match
    this.mapLayout = pickRandomLayout();

    const playerList = [...this.players.values()];
    playerList.forEach((player) => {
      player.resetForMatch(this.mapLayout.spawnX, this.mapLayout.spawnY);
      player.role = Role.CODEMATE;
      player.setPreferredLanguage(this.selectedLanguage);
    });

    for (const task of this.tasks) {
      this.sharedTaskCode[task.id] = this.getStarterCode(task);
      this.taskEditors[task.id] = [];
      this.taskCursors[task.id] = {};
    }

    const imposterIndex = Math.floor(Math.random() * playerList.length);
    playerList[imposterIndex].role = Role.IMPOSTER;
  }

  updatePlayerPosition(socketId, dx, dy) {
    const player = this.players.get(socketId);
    if (!player || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return false;
    }

    const nextX = clamp(player.x + dx, 24, MAP_BOUNDS.width  - 24);
    const nextY = clamp(player.y + dy, 24, MAP_BOUNDS.height - 24);
    const zones = this.mapLayout?.walkable ?? [];

    if (isWalkable(nextX, nextY, zones)) {
      player.x = nextX;
      player.y = nextY;
    } else if (isWalkable(nextX, player.y, zones)) {
      player.x = nextX;
    } else if (isWalkable(player.x, nextY, zones)) {
      player.y = nextY;
    }

    return true;
  }

  canInteractWithTask(socketId, stationId) {
    const player = this.players.get(socketId);
    if (!player || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Task interaction is unavailable right now." };
    }

    // Use current layout's station positions
    const station = this.mapLayout?.stations.find((s) => s.id === stationId);
    if (!station) {
      return { ok: false, error: "Unknown task station." };
    }

    const distance = Math.hypot(player.x - station.x, player.y - station.y);
    if (distance > INTERACTION_RADIUS) {
      return { ok: false, error: "Move closer to the station." };
    }

    const task = this.tasks.find((entry) => entry.stationId === stationId);
    if (!task) {
      return { ok: false, error: "No task found at this station." };
    }

    return { ok: true, player, task };
  }

  buildTaskPayload(task, player) {
    const language = this.selectedLanguage;
    const payload = {
      id: task.id,
      type: task.type,
      stationId: task.stationId,
      title: task.title,
      prompt: task.prompt,
      language,
      languageLabel: LANGUAGE_LABELS[language],
      starterCode: this.getStarterCode(task),
      currentCode: this.sharedTaskCode[task.id] ?? this.getStarterCode(task),
      activeEditors: this.taskEditors[task.id] ?? [],
      cursors: Object.values(this.taskCursors[task.id] ?? {}),
      visibleChecks: task.visibleChecks,
      corrupted: task.id === this.corruptedTaskId,
      fakeOnly: player.role === Role.IMPOSTER
    };

    return payload;
  }

  runTaskCode(socketId, taskId, response) {
    const player = this.players.get(socketId);
    const task = this.tasks.find((entry) => entry.id === taskId);

    if (!player || !task || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Code execution is unavailable right now." };
    }

    if (player.role === Role.IMPOSTER) {
      return {
        ok: true,
        result: {
          passed: false,
          summary: "Imposters can fake code tasks, but their output never changes real progress.",
          results: []
        }
      };
    }

    return {
      ok: true,
      result: evaluateTaskCode(task, this.selectedLanguage, response?.code ?? this.sharedTaskCode[task.id])
    };
  }

  submitTask(socketId, taskId, response) {
    const player = this.players.get(socketId);
    const task = this.tasks.find((entry) => entry.id === taskId);

    if (!player || !task || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Task submission is invalid right now." };
    }

    if (player.role === Role.IMPOSTER) {
      return { ok: true, fake: true, message: "Fake task logged. No real progress awarded." };
    }

    if (task.status === "completed") {
      return { ok: false, error: "This task is already complete." };
    }

    const submittedCode = response?.code ?? this.sharedTaskCode[task.id];
    const result = evaluateTaskCode(task, this.selectedLanguage, submittedCode);
    if (!result.passed) {
      return {
        ok: false,
        error: result.summary,
        result
      };
    }

    task.markCompleted(player.id);
    this.sharedTaskCode[task.id] = submittedCode;
    player.completedTasks.push(task.id);
    this.taskProgress = this.completedTaskCount / this.tasks.length;
    if (this.corruptedTaskId === task.id) {
      this.corruptedTaskId = null;
      this.activeSabotage = null;
      this.statusText = "Corrupted task repaired";
    }

    this.evaluateWinConditions();
    return { ok: true, fake: false, message: "Task completed.", result };
  }

  triggerSabotage(socketId, type) {
    const player = this.players.get(socketId);
    if (!player || player.role !== Role.IMPOSTER || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Sabotage unavailable." };
    }

    if (type === "blackout" && Date.now() < this.blackoutCooldownUntil) {
      return { ok: false, error: "Blackout is cooling down." };
    }

    if (this.activeSabotage?.active) {
      return { ok: false, error: "A sabotage is already active." };
    }

    const sabotage = new Sabotage({
      id: `${type}-${Date.now()}`,
      type,
      duration: type === "blackout" ? 20000 : 30000
    });

    this.activeSabotage = sabotage;
    if (type === "blackout") {
      this.blackoutCooldownUntil = Date.now() + BLACKOUT_COOLDOWN_MS;
    }
    this.disruption += 1;
    this.statusText = type === "blackout" ? "Blackout active" : "Code corruption active";

    if (type === "code_corruption") {
      const pendingTasks = this.tasks.filter((task) => task.status === "pending");
      const target = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
      this.corruptedTaskId = target?.id ?? null;
      if (target) {
        this.sharedTaskCode[target.id] = this.getStarterCode(target);
      }
    }

    this.evaluateWinConditions();
    return { ok: true, sabotage };
  }

  resolveSabotage() {
    if (!this.activeSabotage) {
      return;
    }

    this.activeSabotage.active = false;
    this.activeSabotage = null;
    this.corruptedTaskId = null;
    this.statusText = "Systems stabilized";
  }

  updateTaskCode(socketId, taskId, code) {
    const player = this.players.get(socketId);
    const task = this.tasks.find((entry) => entry.id === taskId);

    if (!player || !task || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Shared editing is unavailable right now." };
    }

    this.sharedTaskCode[taskId] = String(code ?? "");
    if (!this.taskEditors[taskId]?.includes(player.name)) {
      this.taskEditors[taskId] = [...(this.taskEditors[taskId] ?? []), player.name];
    }

    return {
      ok: true,
      payload: {
        taskId,
        code: this.sharedTaskCode[taskId],
        activeEditors: this.taskEditors[taskId],
        cursors: Object.values(this.taskCursors[taskId] ?? {})
      }
    };
  }

  updateTaskCursor(socketId, taskId, selectionStart, selectionEnd) {
    const player = this.players.get(socketId);
    const task = this.tasks.find((entry) => entry.id === taskId);

    if (!player || !task || !player.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Cursor sync is unavailable right now." };
    }

    const code = this.sharedTaskCode[taskId] ?? this.getStarterCode(task);
    const maxIndex = code.length;
    const start = Math.max(0, Math.min(Number(selectionStart) || 0, maxIndex));
    const end = Math.max(0, Math.min(Number(selectionEnd) || start, maxIndex));

    if (!this.taskCursors[taskId]) {
      this.taskCursors[taskId] = {};
    }

    this.taskCursors[taskId][socketId] = {
      playerId: socketId,
      name: player.name,
      start,
      end
    };

    return {
      ok: true,
      payload: {
        taskId,
        cursors: Object.values(this.taskCursors[taskId])
      }
    };
  }

  stopEditingTask(socketId, taskId) {
    const player = this.players.get(socketId);
    if (!player || !this.taskEditors[taskId]) {
      return null;
    }

    this.taskEditors[taskId] = this.taskEditors[taskId].filter((name) => name !== player.name);
    if (this.taskCursors[taskId]) {
      delete this.taskCursors[taskId][socketId];
    }

    return {
      taskId,
      code: this.sharedTaskCode[taskId],
      activeEditors: this.taskEditors[taskId],
      cursors: Object.values(this.taskCursors[taskId] ?? {})
    };
  }

  startMeeting(callerId) {
    const caller = this.players.get(callerId);
    if (!caller || !caller.isAlive || this.state !== "in_game" || this.meeting) {
      return { ok: false, error: "Meeting unavailable." };
    }

    this.clearMeetingTimer();

    const voters = [...this.players.values()].map((player) => player.id);
    this.meeting = new MeetingManager(voters);
    this.statusText = `${caller.name} called a meeting`;
    return { ok: true };
  }

  submitVote(voterId, targetId) {
    if (!this.meeting) {
      return { ok: false, error: "No meeting is active." };
    }

    const voter = this.players.get(voterId);
    if (!voter) {
      return { ok: false, error: "Only players in the room can vote." };
    }

    const accepted = this.meeting.voteManager.submitVote(voterId, targetId);
    if (!accepted) {
      return { ok: false, error: "Vote was already submitted." };
    }

    return { ok: true, complete: this.meeting.voteManager.allVotesIn() };
  }

  finalizeMeeting() {
    if (!this.meeting) {
      return null;
    }

    const meeting = this.meeting;
    this.clearMeetingTimer();

    const result = meeting.voteManager.tally();
    meeting.result = result;

    const finalized = {
      ...meeting.serialize(),
      result
    };

    if (result.eliminatedId) {
      const eliminatedPlayer = this.players.get(result.eliminatedId);
      if (eliminatedPlayer) {
        eliminatedPlayer.isAlive = false;
      }
    }

    this.statusText = result.eliminatedId ? "Vote complete" : "Vote skipped";
    this.meeting = null;
    this.evaluateWinConditions();
    return finalized;
  }

  evaluateWinConditions() {
    if (this.winner || this.state !== "in_game") {
      return this.winner;
    }

    const alivePlayers = [...this.players.values()].filter((player) => player.isAlive);
    const aliveCodemates = alivePlayers.filter((player) => player.role === Role.CODEMATE);
    const aliveImposters = alivePlayers.filter((player) => player.role === Role.IMPOSTER);

    if (aliveImposters.length === 0) {
      this.winner = "Codemates";
    } else if (this.completedTaskCount === this.tasks.length) {
      this.winner = "Codemates";
    } else if (aliveImposters.length >= aliveCodemates.length) {
      this.winner = "Imposter";
    } else if (this.disruption >= 4) {
      this.winner = "Imposter";
    }

    if (this.winner) {
      this.state = "ended";
      this.statusText = `${this.winner} win`;
      this.clearMeetingTimer();
      this.meeting = null;
      this.activeSabotage = null;
    }

    return this.winner;
  }

  schedule(action) {
    this.scheduledActions.add(action);
  }

  setMeetingTimer(timer) {
    this.clearMeetingTimer();
    this.meetingTimer = timer;
    this.schedule(timer);
  }

  clearMeetingTimer() {
    if (!this.meetingTimer) {
      return;
    }

    clearTimeout(this.meetingTimer);
    this.scheduledActions.delete(this.meetingTimer);
    this.meetingTimer = null;
  }

  clearSchedules() {
    for (const timer of this.scheduledActions) {
      clearTimeout(timer);
    }
    this.scheduledActions.clear();
    this.meetingTimer = null;
  }

  get completedTaskCount() {
    return this.tasks.filter((task) => task.status === "completed").length;
  }

  serializeForPlayer(socketId) {
    const viewer = this.players.get(socketId);
    return {
      roomId: this.roomId,
      state: this.state,
      winner: this.winner,
      statusText: this.statusText,
      hostId: this.hostId,
      currentPlayerId: socketId,
      players: [...this.players.values()].map((player) =>
        player.serialize({
          revealRole: this.state === "ended" || player.id === socketId
        })
      ),
      tasks: this.tasks.map((task) => ({
        id: task.id,
        stationId: task.stationId,
        type: task.type,
        title: task.title,
        status: task.status,
        completedBy: task.completedBy,
        corrupted: task.id === this.corruptedTaskId
      })),
      taskProgress: this.tasks.length ? this.completedTaskCount / this.tasks.length : 0,
      activeSabotage: this.activeSabotage?.serialize() ?? null,
      blackoutCooldownUntil: this.blackoutCooldownUntil,
      disruption: this.disruption,
      meeting: this.meeting?.serialize() ?? null,
      viewerRole: viewer?.role ?? null,
      selectedLanguage: this.selectedLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES.map((language) => ({
        value: language,
        label: LANGUAGE_LABELS[language]
      })),
      map: {
        width: MAP_BOUNDS.width,
        height: MAP_BOUNDS.height,
        rooms: this.mapLayout?.rooms ?? [],
        corridor: this.mapLayout?.corridor ?? null,
        stations: this.mapLayout?.stations ?? []
      }
    };
  }
}

GameRoom.prototype.getStarterCode = function getStarterCode(task) {
  const languageTask = task.languages[this.selectedLanguage] ?? task.languages.javascript;
  return this.corruptedTaskId === task.id
    ? languageTask.corruptedStarterCode ?? languageTask.starterCode
    : languageTask.starterCode;
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Walkable zones: must match MAP_WALKABLE in client/src/data/mapData.js
// Corridors connect at exact room edges — no pixel overlap between zones.
const WALKABLE_ZONES = [
  // Rooms
  { x: 20,  y: 15,  w: 175, h: 155 }, // Inheritance Bay
  { x: 445, y: 15,  w: 175, h: 155 }, // Polymorphism Lab
  { x: 235, y: 265, w: 170, h: 145 }, // Encapsulation Vault
  // Corridors
  { x: 82,  y: 170, w: 50,  h: 50  }, // Left vertical (Inheritance Bay → center)
  { x: 507, y: 170, w: 50,  h: 50  }, // Right vertical (Polymorphism Lab → center)
  { x: 82,  y: 220, w: 475, h: 45  }, // Center horizontal
];

function isWalkable(x, y) {
  return WALKABLE_ZONES.some(
    (zone) => x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h
  );
}
