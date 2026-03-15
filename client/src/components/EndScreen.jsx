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

        {roomState.tasks?.some((task) => task.optimalSolution) ? (
          <div className="end-reviews">
            <h3>Optimal Solutions</h3>
            <p className="helper-text">Revealed only after the match ends.</p>
            {roomState.tasks
              .filter((task) => task.optimalSolution)
              .map((task) => (
                <div key={task.id} className="end-review-card">
                  <div className="task-panel-header">
                    <span>{task.title}</span>
                    <span>Reference</span>
                  </div>
                  <pre className="snippet">{task.optimalSolution}</pre>
                </div>
              ))}
          </div>
        ) : null}

        <button onClick={onReset}>Back To Lobby</button>
      </div>
    </div>
  );
}
