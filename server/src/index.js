import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { GameRoom } from "./models/GameRoom.js";
import { getImposterHints, verifyCode, getMeetingInsights, isAgentAvailable } from "./services/agentBridge.js";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(cors({ origin: true }));
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();
const socketToRoom = new Map();

io.on("connection", (socket) => {
  socket.on("create_room", ({ name, preferredLanguage }, callback = () => {}) => {
    const roomId = createRoomId();
    const room = new GameRoom(roomId, socket.id, sanitizeName(name), preferredLanguage);
    rooms.set(roomId, room);
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    callback({ ok: true, roomId, state: room.serializeForPlayer(socket.id) });
    syncRoom(roomId);
  });

  socket.on("join_room", ({ roomId, name }, callback = () => {}) => {
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) {
      callback({ ok: false, error: "Room not found." });
      return;
    }

    const result = room.addPlayer(socket.id, sanitizeName(name), false);
    if (!result.ok) {
      callback(result);
      return;
    }

    socketToRoom.set(socket.id, room.roomId);
    socket.join(room.roomId);
    callback({ ok: true, roomId: room.roomId, state: room.serializeForPlayer(socket.id) });
    syncRoom(room.roomId);
  });

  socket.on("player_ready", ({ isReady }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    if (!room?.setReady(socket.id, Boolean(isReady))) {
      callback({ ok: false, error: "Unable to update ready state." });
      return;
    }

    callback({ ok: true });
    syncRoom(room.roomId);
  });

  socket.on("set_language", ({ language }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    if (!room?.setPlayerLanguage(socket.id, language)) {
      callback({ ok: false, error: "Unable to update language." });
      return;
    }

    callback({ ok: true });
    syncRoom(room.roomId);
  });

  socket.on("update_task_code", ({ taskId, code }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.updateTaskCode(socket.id, taskId, code);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    io.to(room.roomId).emit("task_code_updated", result.payload);
    callback({ ok: true });
  });

  socket.on("stop_task_edit", ({ taskId }) => {
    const room = getCurrentRoom(socket.id);
    const payload = room?.stopEditingTask(socket.id, taskId);
    if (!room || !payload) {
      return;
    }

    io.to(room.roomId).emit("task_code_updated", payload);
  });

  socket.on("update_task_cursor", ({ taskId, selectionStart, selectionEnd }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.updateTaskCursor(socket.id, taskId, selectionStart, selectionEnd);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    io.to(room.roomId).emit("task_cursor_updated", result.payload);
    callback({ ok: true });
  });

  socket.on("start_game", async (_payload, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const canStart = room?.canStart(socket.id);
    if (!room || !canStart?.ok) {
      callback(canStart ?? { ok: false, error: "Room not found." });
      return;
    }

    await room.startGame(() => {
      // Sync "generating" state to all clients so they see the loading screen
      syncRoom(room.roomId);
    }, () => {
      // Sync immediately when the 5-minute match timer expires
      syncRoom(room.roomId);
    });
    callback({ ok: true });
    syncRoom(room.roomId);
  });

  socket.on("player_move", ({ dx, dy }) => {
    const room = getCurrentRoom(socket.id);
    if (!room?.updatePlayerPosition(socket.id, Number(dx) || 0, Number(dy) || 0)) {
      return;
    }

    syncRoom(room.roomId);
  });

  socket.on("interact_task", ({ stationId }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.canInteractWithTask(socket.id, stationId);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    callback({
      ok: true,
      task: room.buildTaskPayload(result.task, result.player)
    });
  });

  socket.on("submit_task", async ({ taskId, response }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = await room?.submitTask(socket.id, taskId, response);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    callback(result);
    syncRoom(room.roomId);
  });

  socket.on("run_task_code", ({ taskId, response }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.runTaskCode(socket.id, taskId, response);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    callback(result);
  });

  socket.on("trigger_sabotage", ({ type }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.triggerSabotage(socket.id, type);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    const timer = setTimeout(() => {
      room.resolveSabotage();
      syncRoom(room.roomId);
    }, result.sabotage.duration);
    room.schedule(timer);

    callback({ ok: true });
    syncRoom(room.roomId);
  });

  socket.on("call_meeting", (_payload, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.startMeeting(socket.id);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    const timer = setTimeout(() => {
      room.finalizeMeeting();
      syncRoom(room.roomId);
    }, 30000);
    room.setMeetingTimer(timer);

    callback({ ok: true });
    syncRoom(room.roomId);
  });

  socket.on("submit_vote", ({ targetId }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const result = room?.submitVote(socket.id, targetId);
    if (!room || !result?.ok) {
      callback(result ?? { ok: false, error: "Room not found." });
      return;
    }

    if (result.complete) {
      room.finalizeMeeting();
    }

    callback({ ok: true });
    syncRoom(room.roomId);
  });

  socket.on("sync_game_state", (_payload, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    if (!room) {
      callback({ ok: false, error: "Room not found." });
      return;
    }

    callback({ ok: true, state: room.serializeForPlayer(socket.id) });
  });

  // ── AI Agent Events ───────────────────────────────────────────────────────

  socket.on("request_imposter_hints", async ({ taskId }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const player = room?.getPlayer(socket.id);

    if (!room || !player || player.role !== "Imposter") {
      callback({ ok: false, error: "Hints unavailable." });
      return;
    }

    const task = room.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      callback({ ok: false, error: "Task not found." });
      return;
    }

    const currentCode = room.sharedTaskCode[taskId] ?? "";
    const result = await getImposterHints(
      task.type,
      room.selectedLanguage,
      currentCode,
      task.prompt
    );

    if (result?.ok && Array.isArray(result.hints) && result.hints.length > 0) {
      callback(result);
      return;
    }

    callback({
      ok: true,
      hints: [
        {
          code_snippet: currentCode,
          bad_practice: "AI sabotage intel unavailable right now. Keep this code looking busy by adding small but unnecessary complexity."
        }
      ]
    });
  });

  socket.on("request_ai_verify", async ({ taskId, code }, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    const player = room?.getPlayer(socket.id);

    if (!room || !player || !player.isAlive || room.state !== "in_game") {
      callback({ ok: false, error: "Verification unavailable." });
      return;
    }

    const task = room.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      callback({ ok: false, error: "Task not found." });
      return;
    }

    const result = await verifyCode(
      task.type,
      room.selectedLanguage,
      code ?? room.sharedTaskCode[taskId] ?? "",
      task.prompt
    );

    callback(result);
  });

  socket.on("request_meeting_insights", async (_payload, callback = () => {}) => {
    const room = getCurrentRoom(socket.id);
    if (!room || !room.meeting) {
      callback({ ok: false, error: "No meeting active." });
      return;
    }

    const players = [...room.players.values()].map((player) => ({
      name: player.name,
      isAlive: player.isAlive,
      completedTasks: player.completedTasks
    }));

    const result = await getMeetingInsights(
      players,
      room.taskEditors,
      room.disruption,
      room.taskProgress
    );

    callback(result);
  });

  socket.on("check_agent_status", async (_payload, callback = () => {}) => {
    const available = await isAgentAvailable();
    callback({ ok: true, agentAvailable: available });
  });

  socket.on("disconnect", () => {
    const room = getCurrentRoom(socket.id);
    if (!room) {
      return;
    }

    room.removePlayer(socket.id);
    socketToRoom.delete(socket.id);

    if (room.players.size === 0) {
      room.clearSchedules();
      rooms.delete(room.roomId);
      return;
    }

    syncRoom(room.roomId);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Code Sus server listening on ${HOST}:${PORT}`);
});

function getCurrentRoom(socketId) {
  const roomId = socketToRoom.get(socketId);
  return roomId ? rooms.get(roomId) : null;
}

function syncRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  for (const player of room.players.values()) {
    io.to(player.id).emit("sync_game_state", room.serializeForPlayer(player.id));
  }
}

function createRoomId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let roomId = "";

  do {
    roomId = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(roomId));

  return roomId;
}

function sanitizeName(name) {
  const cleaned = String(name || "Player").trim().slice(0, 16);
  return cleaned || "Player";
}
