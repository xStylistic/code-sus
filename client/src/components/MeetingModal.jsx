import { useEffect, useState } from "react";
import { getColorByKey } from "../data/playerColors.js";

export function MeetingModal({ roomState, onVote, meetingInsights, onRequestInsights, aiLoading }) {
  const meeting = roomState?.meeting;
  const me = roomState?.players.find((player) => player.id === roomState.currentPlayerId);
  const canVote = Boolean(me);
  const alivePlayers = roomState?.players.filter((player) => player.isAlive) ?? [];
  const alreadyVoted = Boolean(meeting?.votes?.[roomState.currentPlayerId]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!meeting) {
      return undefined;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [meeting]);

  const secondsLeft = meeting ? Math.max(0, Math.ceil((meeting.endsAt - now) / 1000)) : 0;

  if (!meeting || !canVote) {
    return null;
  }

  return (
    <div className="overlay">
      <div className="modal meeting-modal">
        <p className="eyebrow">Emergency meeting</p>
        <h3>Who injected the bugs?</h3>
        <p>{secondsLeft}s left to discuss and vote.</p>

        {/* ── AI Meeting Insights ── */}
        {meetingInsights ? (
          <div className="ai-insights">
            <div className="task-panel-header" style={{ marginTop: 8 }}>
              <span>AI Analysis</span>
            </div>
            {meetingInsights.suspicious_behaviors.map((obs, i) => (
              <p key={i} className="banner banner--warning" style={{ marginBottom: 6, fontSize: "0.85rem" }}>
                {obs}
              </p>
            ))}
            {meetingInsights.discussion_prompts.map((prompt, i) => (
              <p key={`q-${i}`} className="helper-text" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
                {prompt}
              </p>
            ))}
            <p className="banner" style={{ fontSize: "0.85rem", marginTop: 6 }}>
              {meetingInsights.tip}
            </p>
          </div>
        ) : onRequestInsights ? (
          <button
            className="button-secondary button-ai"
            disabled={aiLoading}
            onClick={onRequestInsights}
            style={{ marginBottom: 12, width: "100%" }}
          >
            {aiLoading ? "AI Analyzing..." : "Ask AI for Analysis"}
          </button>
        ) : null}

        <div className="vote-grid">
          {alivePlayers.map((player) => {
            const c = getColorByKey(player.color);
            return (
              <button key={player.id} disabled={alreadyVoted} onClick={() => onVote(player.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <i
                  className="player-color-dot"
                  style={{ background: `linear-gradient(180deg, ${c.top}, ${c.bottom})` }}
                />
                {player.name}
              </button>
            );
          })}
          <button className="button-secondary" disabled={alreadyVoted} onClick={() => onVote("skip")}>
            Skip Vote
          </button>
        </div>

        <p className="helper-text">Votes submitted: {Object.keys(meeting.votes ?? {}).length}</p>
      </div>
    </div>
  );
}
