import { useEffect, useMemo, useRef } from "react";
import { MAP_ROOMS } from "../data/mapData.js";

const MOVE_STEP = 8;

export function GameBoard({
  roomState,
  onMove,
  onOpenTask,
  onCallMeeting,
  onTriggerSabotage
}) {
  const keysRef = useRef(new Set());
  const me = roomState.players.find((player) => player.id === roomState.currentPlayerId);
  const nearbyStation = useMemo(() => {
    if (!me) {
      return null;
    }

    return roomState.map.stations.find((station) => Math.hypot(me.x - station.x, me.y - station.y) < 80) ?? null;
  }, [me, roomState.map.stations]);

  useEffect(() => {
    const onKeyDown = (event) => keysRef.current.add(event.key.toLowerCase());
    const onKeyUp = (event) => keysRef.current.delete(event.key.toLowerCase());

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const interval = window.setInterval(() => {
      if (!me?.isAlive || roomState.meeting) {
        return;
      }

      let dx = 0;
      let dy = 0;

      if (keysRef.current.has("w") || keysRef.current.has("arrowup")) dy -= MOVE_STEP;
      if (keysRef.current.has("s") || keysRef.current.has("arrowdown")) dy += MOVE_STEP;
      if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) dx -= MOVE_STEP;
      if (keysRef.current.has("d") || keysRef.current.has("arrowright")) dx += MOVE_STEP;

      if (dx !== 0 || dy !== 0) {
        onMove(dx, dy);
      }
    }, 80);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(interval);
    };
  }, [me?.isAlive, onMove, roomState.meeting]);

  return (
    <div className="game-layout">
      <section className={`map-shell ${roomState.activeSabotage?.type === "blackout" ? "map-shell--blackout" : ""}`}>
        <div className="map-topbar">
          <div>
            <p className="eyebrow">OOP System Map</p>
            <h2>Shipwide Codebase</h2>
          </div>
          <div className="map-legend">
            <span><i className="legend-dot legend-dot--task" /> Task node</span>
            <span><i className="legend-dot legend-dot--bug" /> Corrupted node</span>
            <span><i className="legend-dot legend-dot--player" /> Crew position</span>
          </div>
        </div>
        <div className="map" style={{ width: roomState.map.width, height: roomState.map.height }}>
          <div className="map-corridor map-corridor--top" />
          <div className="map-corridor map-corridor--mid" />
          <div className="map-corridor map-corridor--vertical" />
          {MAP_ROOMS.map((room) => (
            <div
              key={room.id}
              className="map-room"
              style={{
                left: room.x,
                top: room.y,
                width: room.width,
                height: room.height,
                "--room-accent": room.color,
                "--room-glow": room.glow
              }}
            >
              <strong>{room.name}</strong>
              <small>{room.subtitle}</small>
            </div>
          ))}

          {roomState.map.stations.map((station) => {
            const task = roomState.tasks.find((entry) => entry.stationId === station.id);
            return (
              <button
                key={station.id}
                className={`station ${task?.status === "completed" ? "station--done" : ""} ${
                  task?.corrupted ? "station--corrupted" : ""
                }`}
                style={{ left: station.x - 18, top: station.y - 18 }}
                onClick={() => onOpenTask(station.id)}
              >
                <span>{station.label}</span>
              </button>
            );
          })}

          {roomState.players.map((player) => (
            <div
              key={player.id}
              className={`avatar ${player.id === roomState.currentPlayerId ? "avatar--self" : ""} ${
                !player.isAlive ? "avatar--ghost" : ""
              }`}
              style={{ left: player.x - 16, top: player.y - 16 }}
            >
              <div className="avatar-body" />
              <span>{player.name}</span>
            </div>
          ))}
        </div>
      </section>

      <aside className="sidebar">
        <div className={`panel panel--hero ${roomState.viewerRole === "Imposter" ? "panel--imposter" : "panel--codemate"}`}>
          <p className="eyebrow">Role</p>
          <h2>{roomState.viewerRole}</h2>
          <p>{roomState.viewerRole === "Imposter" ? "Pose as a contributor and break the architecture from within." : "Keep the OOP system stable and expose the imposter."}</p>
          <div className="stat-chips">
            <span>{roomState.selectedLanguage}</span>
            <span>{me?.isAlive ? "Active" : "Spectating"}</span>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">System Status</p>
          <p>{roomState.statusText}</p>
          <div className="progress-bar">
            <div style={{ width: `${Math.round(roomState.taskProgress * 100)}%` }} />
          </div>
          <p>Team progress: {Math.round(roomState.taskProgress * 100)}%</p>
          <p>Sabotage pressure: {roomState.disruption}/4</p>
          {!me?.isAlive ? <p className="banner">Spectator mode: you can watch the ship, but you cannot act.</p> : null}
        </div>

        <div className="panel">
          <p className="eyebrow">Actions</p>
          <button disabled={!nearbyStation || !me?.isAlive} onClick={() => onOpenTask(nearbyStation?.id)}>
            {nearbyStation ? `Use ${nearbyStation.label}` : "Move near a task station"}
          </button>
          <button className="button-secondary" disabled={!me?.isAlive || roomState.meeting} onClick={onCallMeeting}>
            Call Meeting
          </button>
          {roomState.viewerRole === "Imposter" ? (
            <>
              <button className="button-danger" disabled={Boolean(roomState.activeSabotage)} onClick={() => onTriggerSabotage("blackout")}>
                Trigger Blackout
              </button>
              <button className="button-danger" disabled={Boolean(roomState.activeSabotage)} onClick={() => onTriggerSabotage("code_corruption")}>
                Corrupt Task
              </button>
            </>
          ) : null}
        </div>

        <div className="panel">
          <p className="eyebrow">System Contributors</p>
          <div className="player-list">
            {roomState.players.map((player) => (
              <div className="player-row" key={player.id}>
                <span>{player.name}</span>
                <span>{player.isAlive ? `${player.completedTasks.length} tasks` : "Spectating"}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
