// No static map exports used anymore
import { useEffect, useMemo, useRef, useState } from "react";

const MOVE_STEP = 8;

// Role display labels
const ROLE_LABELS = {
  Imposter: "Hacker",
  Codemate: "Codemate",
};

export function GameBoard({
  roomState,
  onMove,
  onOpenTask,
  onCallMeeting,
  onTriggerSabotage
}) {
  const keysRef = useRef(new Set());
  const [now, setNow] = useState(Date.now());
  const me = roomState.players.find((player) => player.id === roomState.currentPlayerId);
  const blackoutCooldownMs = Math.max(0, (roomState.blackoutCooldownUntil ?? 0) - now);
  const blackoutCooldownSeconds = Math.ceil(blackoutCooldownMs / 1000);
  const nearbyStation = useMemo(() => {
    if (!me) return null;
    return roomState.map.stations.find(
      (station) => Math.hypot(me.x - station.x, me.y - station.y) < 80
    ) ?? null;
  }, [me, roomState.map.stations]);

  const roleLabel = ROLE_LABELS[roomState.viewerRole] ?? roomState.viewerRole;
  const isImposter = roomState.viewerRole === "Imposter";

  useEffect(() => {
    const onKeyDown = (event) => {
      // Don't steal keys from form inputs
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      keysRef.current.add(event.key.toLowerCase());
    };
    const onKeyUp = (event) => keysRef.current.delete(event.key.toLowerCase());

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const moveInterval = window.setInterval(() => {
      if (!me?.isAlive || roomState.meeting) return;

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

    const timeInterval = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(moveInterval);
      window.clearInterval(timeInterval);
    };
  }, [me?.isAlive, onMove, roomState.meeting]);

  return (
    <div className="game-layout">
      {/* ── Map area ─────────────────────────────────────────────── */}
      <section className={`map-shell ${roomState.activeSabotage?.type === "blackout" ? "map-shell--blackout" : ""}`}>
        <div className="map-topbar">
          <div>
            <p className="eyebrow">OOP System Map</p>
            <h2>Shipwide Codebase</h2>
          </div>
          <div className="map-legend">
            <span><i className="legend-dot legend-dot--task" /> Task node</span>
          </div>
        </div>

        <div
          className="map"
          style={{
            "--map-width": `${roomState.map.width}px`,
            "--map-height": `${roomState.map.height}px`
          }}
        >
          {/* ── Walkable corridors (visual) ──────────────────────── */}
          {roomState.map.corridors?.map((corridor, i) => (
            <div
              key={`corridor-${i}`}
              className="map-corridor"
              style={{
                left: corridor.x,
                top: corridor.y,
                width: corridor.w,
                height: corridor.h
              }}
            />
          ))}

          {/* ── Rooms ────────────────────────────────────────────── */}
          {roomState.map.rooms.map((room) => (
            <div
              key={room.id}
              className="map-room"
              style={{
                left: room.x,
                top: room.y,
                width: room.w || room.width, // fallback to handle 'w' or 'width'
                height: room.h || room.height,
                "--room-accent": room.color,
                "--room-glow": room.glow
              }}
            >
              <strong>{room.name}</strong>
              <small>{room.subtitle}</small>
            </div>
          ))}

          {/* ── Task station buttons (bottom-center of each room) ── */}
          {roomState.map.stations.map((station) => {
            const task = roomState.tasks.find((t) => t.stationId === station.id);
            const isDone = task?.status === "completed";
            const isCorrupted = task?.corrupted;
            return (
              <button
                key={station.id}
                className={`station ${isDone ? "station--done" : ""} ${isCorrupted ? "station--corrupted" : ""}`}
                // x/y are the game-space center; offset by half the 42px button width
                style={{ left: station.x - 21, top: station.y - 21 }}
                onClick={() => onOpenTask(station.id)}
                title={station.label}
              >
                <span>{station.label}</span>
              </button>
            );
          })}

          {/* ── Player avatars ────────────────────────────────────── */}
          {roomState.players.map((player) => (
            <div
              key={player.id}
              className={`avatar ${player.id === roomState.currentPlayerId ? "avatar--self" : ""} ${!player.isAlive ? "avatar--ghost" : ""}`}
              style={{ left: player.x - 16, top: player.y - 16 }}
            >
              <div className="avatar-body" />
              <span>{player.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Role card */}
        <div className={`panel panel--hero ${isImposter ? "panel--imposter" : "panel--codemate"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="eyebrow" style={{ margin: 0 }}>Role</span>
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.08em",
              color: isImposter ? "var(--accent-red)" : "var(--accent-cyan)"
            }}>
              {roleLabel}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 10 }}>
            {isImposter
              ? "Blend in, fake progress, sabotage, and survive the vote."
              : "Repair the OOP system, finish real coding tasks, find the hacker."}
          </p>
          <div className="stat-chips">
            <span>{roomState.selectedLanguage}</span>
            <span>{me?.isAlive ? "Active" : "Spectating"}</span>
          </div>
        </div>

        {/* Status */}
        <div className="panel">
          <p className="eyebrow">System Status</p>
          <p style={{ marginBottom: 8 }}>{roomState.statusText}</p>
          <div className="progress-bar">
            <div style={{ width: `${Math.round(roomState.taskProgress * 100)}%` }} />
          </div>
          <p style={{ marginTop: 6, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            Progress: {Math.round(roomState.taskProgress * 100)}% &nbsp;·&nbsp; Sabotage: {roomState.disruption}/4
          </p>
          {!me?.isAlive && (
            <p className="banner" style={{ marginTop: 10 }}>
              Spectator mode — you can watch but not act.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="panel">
          <p className="eyebrow">Actions</p>
          <div className="action-list">
            <button disabled={!nearbyStation || !me?.isAlive} onClick={() => onOpenTask(nearbyStation?.id)}>
              {nearbyStation ? `Use ${nearbyStation.label}` : "Move near a task station"}
            </button>
            <button className="button-secondary" disabled={!me?.isAlive || roomState.meeting} onClick={onCallMeeting}>
              Call Meeting
            </button>
            {roomState.viewerRole === "Imposter" ? (
              <>
                <button
                  className="button-danger"
                  disabled={Boolean(roomState.activeSabotage) || blackoutCooldownMs > 0}
                  onClick={() => onTriggerSabotage("blackout")}
                >
                  {blackoutCooldownMs > 0 ? `Blackout ${blackoutCooldownSeconds}s` : "Trigger Blackout"}
                </button>
                <button className="button-danger" disabled={Boolean(roomState.activeSabotage)} onClick={() => onTriggerSabotage("code_corruption")}>
                  Corrupt Task
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Players */}
        <div className="panel">
          <p className="eyebrow">System Contributors</p>
          <div className="player-list">
            {roomState.players.map((player) => (
              <div className="player-row" key={player.id}>
                <span>{player.name}</span>
                <span style={{ color: player.isAlive ? "var(--accent-cyan)" : "var(--text-dim)", fontSize: "0.82rem" }}>
                  {player.isAlive ? `${player.completedTasks.length} tasks` : "Ejected"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
