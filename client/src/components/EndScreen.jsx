export function EndScreen({ roomState, aiReviews, onReset }) {
  return (
    <div className="overlay">
      <div className="modal end-modal">
        <p className="eyebrow">Match over</p>
        <h2>{roomState.winner} win</h2>
        <p>{roomState.statusText}</p>
        <div className="player-list player-list--results">
          {roomState.players.map((player) => (
            <div className="player-row" key={player.id}>
              <span>{player.name}</span>
              <span>
                {player.role} {player.isAlive ? "Alive" : "Ejected"}
              </span>
            </div>
          ))}
        </div>

        {aiReviews?.length > 0 ? (
          <div className="end-reviews">
            <h3>Code Review Summary</h3>
            <p className="helper-text">Here's what the AI found in your submissions and how to improve.</p>
            {aiReviews.map((review, i) => (
              <div key={i} className="end-review-card">
                <div className="task-panel-header">
                  <span>{review.taskTitle}</span>
                  <span>{review.is_correct ? "Correct" : "Needs Work"}</span>
                </div>
                <p className={`banner ${review.is_correct ? "" : "banner--danger"}`}>
                  {review.explanation}
                </p>
                {review.issues.length > 0 ? (
                  <div className="results-list">
                    {review.issues.map((issue, j) => (
                      <div className="result-row" key={j}>
                        <strong>Issue</strong>
                        <span>{issue}</span>
                      </div>
                    ))}
                    {review.fixes?.map((fix, j) => (
                      <div className="result-row result-row--pass" key={`fix-${j}`}>
                        <strong>Fix</strong>
                        <span>{fix}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <button onClick={onReset}>Back To Lobby</button>
      </div>
    </div>
  );
}
