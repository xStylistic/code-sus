import { useEffect, useState } from "react";

export function MeetingModal({ roomState, onVote }) {
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

        <div className="vote-grid">
          {alivePlayers.map((player) => (
            <button key={player.id} disabled={alreadyVoted} onClick={() => onVote(player.id)}>
              {player.name}
            </button>
          ))}
          <button className="button-secondary" disabled={alreadyVoted} onClick={() => onVote("skip")}>
            Skip Vote
          </button>
        </div>

        <p className="helper-text">Votes submitted: {Object.keys(meeting.votes ?? {}).length}</p>
      </div>
    </div>
  );
}
