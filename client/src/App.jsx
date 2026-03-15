import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { LobbyScreen } from "./components/LobbyScreen.jsx";
import { GameBoard } from "./components/GameBoard.jsx";
import { TaskModal } from "./components/TaskModal.jsx";
import { MeetingModal } from "./components/MeetingModal.jsx";
import { EndScreen } from "./components/EndScreen.jsx";
import { RoleRevealModal } from "./components/RoleRevealModal.jsx";

const defaultServerUrl =
  import.meta.env.VITE_SERVER_URL ??
  `${window.location.protocol}//${window.location.hostname}:3001`;

const socket = io(defaultServerUrl, {
  autoConnect: true
});

export default function App() {
  const [form, setForm] = useState({ name: "Ada", roomId: "", preferredLanguage: "javascript" });
  const [roomState, setRoomState] = useState(null);
  const [task, setTask] = useState(null);
  const [taskCode, setTaskCode] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [roleReveal, setRoleReveal] = useState(null);

  useEffect(() => {
    const handleSync = (state) => {
      setRoomState((previous) => {
        if (previous?.state !== "in_game" && state.state === "in_game" && state.viewerRole) {
          setRoleReveal(state.viewerRole);
        }

        return state;
      });
    };
    const handleTaskCodeUpdated = (payload) => {
      setTask((current) => {
        if (!current || current.id !== payload.taskId) {
          return current;
        }

        if (payload.updatedBy !== socket.id) {
          setTaskCode(payload.code);
        }
        return {
          ...current,
          currentCode: payload.code,
          activeEditors: payload.activeEditors,
          cursors: payload.cursors ?? current.cursors ?? []
        };
      });
    };
    const handleTaskCursorUpdated = (payload) => {
      setTask((current) => {
        if (!current || current.id !== payload.taskId) {
          return current;
        }

        return {
          ...current,
          cursors: payload.cursors ?? []
        };
      });
    };
    socket.on("sync_game_state", handleSync);
    socket.on("task_code_updated", handleTaskCodeUpdated);
    socket.on("task_cursor_updated", handleTaskCursorUpdated);

    return () => {
      socket.off("sync_game_state", handleSync);
      socket.off("task_code_updated", handleTaskCodeUpdated);
      socket.off("task_cursor_updated", handleTaskCursorUpdated);
    };
  }, []);

  const isLobby = !roomState || roomState.state === "lobby";

  const currentReady = useMemo(() => {
    return roomState?.players.find((player) => player.id === roomState.currentPlayerId)?.isReady ?? false;
  }, [roomState]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "roomId" ? value.toUpperCase() : value
    }));
  }

  function emitWithAck(event, payload = {}) {
    return new Promise((resolve) => {
      socket.emit(event, payload, resolve);
    });
  }

  async function createRoom() {
    const response = await emitWithAck("create_room", { name: form.name, preferredLanguage: form.preferredLanguage });
    if (!response.ok) {
      setError(response.error);
      return;
    }

    setRoomState(response.state);
    setForm((current) => ({ ...current, roomId: response.roomId }));
    setError("");
  }

  async function joinRoom() {
    const response = await emitWithAck("join_room", {
      roomId: form.roomId,
      name: form.name
    });
    if (!response.ok) {
      setError(response.error);
      return;
    }

    setRoomState(response.state);
    setForm((current) => ({ ...current, roomId: response.roomId }));
    setError("");
  }

  async function toggleReady() {
    const response = await emitWithAck("player_ready", { isReady: !currentReady });
    if (!response.ok) {
      setError(response.error);
    }
  }

  async function changeLanguage(event) {
    const language = event.target.value;
    setForm((current) => ({
      ...current,
      preferredLanguage: language
    }));

    if (!roomState) {
      return;
    }

    const response = await emitWithAck("set_language", { language });
    if (!response.ok) {
      setError(response.error);
    }
  }

  async function startGame() {
    const response = await emitWithAck("start_game");
    if (!response.ok) {
      setError(response.error);
    }
  }

  async function openTask(stationId) {
    if (!stationId) {
      return;
    }

    const response = await emitWithAck("interact_task", { stationId });
    if (!response.ok) {
      setError(response.error);
      return;
    }

    setTask(response.task);
    setTaskCode(response.task.currentCode ?? response.task.starterCode ?? "");
    setFeedback(null);
    setRunResult(null);
    setError("");
  }

  function handleTaskCodeChange(nextCode) {
    if (!task) {
      setTaskCode(nextCode);
      return;
    }

    setTaskCode(nextCode);
    socket.emit("update_task_code", { taskId: task.id, code: nextCode });
  }

  function handleTaskCursorChange(selectionStart, selectionEnd) {
    if (!task) {
      return;
    }

    socket.emit("update_task_cursor", {
      taskId: task.id,
      selectionStart,
      selectionEnd
    });
  }

  async function runTask(taskId, response) {
    const result = await emitWithAck("run_task_code", { taskId, response });
    if (!result.ok) {
      setFeedback({ ok: false, message: result.error });
      return;
    }

    setRunResult(result.result);
    setFeedback(null);
  }

  async function submitTask(taskId, response) {
    const result = await emitWithAck("submit_task", { taskId, response });
    if (!result.ok) {
      setRunResult(result.result ?? null);
      setFeedback({ ok: false, message: result.error });
      return;
    }

    setRunResult(result.result ?? null);
    setFeedback({ ok: true, message: result.message });
    if (result.ok) {
      window.setTimeout(() => {
        setTask(null);
        setFeedback(null);
        setRunResult(null);
      }, 700);
    }
  }

  async function callMeeting() {
    const response = await emitWithAck("call_meeting");
    if (!response.ok) {
      setError(response.error);
    }
  }

  async function submitVote(targetId) {
    const response = await emitWithAck("submit_vote", { targetId });
    if (!response.ok) {
      setError(response.error);
    }
  }

  async function triggerSabotage(type) {
    const response = await emitWithAck("trigger_sabotage", { type });
    if (!response.ok) {
      setError(response.error);
    }
  }

  function handleMove(dx, dy) {
    socket.emit("player_move", { dx, dy });
  }

  function resetOverlay() {
    if (task) {
      socket.emit("stop_task_edit", { taskId: task.id });
    }
    setTask(null);
    setTaskCode("");
    setFeedback(null);
    setRunResult(null);
  }

  return (
    <div className="app-shell">
      {isLobby ? (
        <LobbyScreen
          form={form}
          onFormChange={handleFormChange}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          roomState={roomState}
          onLanguageChange={changeLanguage}
          onReadyToggle={toggleReady}
          onStartGame={startGame}
          error={error}
        />
      ) : (
        <GameBoard
          roomState={roomState}
          onMove={handleMove}
          onOpenTask={openTask}
          onCallMeeting={callMeeting}
          onTriggerSabotage={triggerSabotage}
        />
      )}

      <TaskModal
        task={task}
        code={taskCode}
        onCodeChange={handleTaskCodeChange}
        onCursorChange={handleTaskCursorChange}
        onClose={resetOverlay}
        onRun={runTask}
        onSubmit={submitTask}
        feedback={feedback}
        runResult={runResult}
        isBlackout={roomState?.activeSabotage?.type === "blackout"}
        canBypassBlackout={roomState?.viewerRole === "Imposter"}
        isSpectator={roomState ? !roomState.players.find((player) => player.id === roomState.currentPlayerId)?.isAlive : false}
        currentPlayerId={roomState?.currentPlayerId}
      />
      <RoleRevealModal role={roleReveal} onClose={() => setRoleReveal(null)} />
      <MeetingModal roomState={roomState} onVote={submitVote} />
      {roomState?.state === "ended" ? <EndScreen roomState={roomState} onReset={() => window.location.reload()} /> : null}
    </div>
  );
}
