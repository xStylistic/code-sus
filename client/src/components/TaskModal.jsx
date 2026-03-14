export function TaskModal({ task, code, onCodeChange, onClose, onRun, onSubmit, feedback, runResult, isBlackout, isSpectator }) {
  if (!task) {
    return null;
  }

  return (
    <div className="overlay">
      <div className="modal modal--code">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{task.type}</p>
            <h3>{task.title}</h3>
          </div>
          <button className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <p>{task.prompt}</p>
        {task.corrupted ? <p className="banner banner--warning">Code Corruption is active. The starter code has been sabotaged and needs a real fix.</p> : null}
        {task.fakeOnly ? <p className="banner">You are faking this task. You can type code, but it will not affect team progress.</p> : null}
        {isSpectator ? <p className="banner">You were voted out. You can spectate the shared code but cannot edit or submit.</p> : null}

        <div className="task-layout">
          <section className={`task-panel ${isBlackout ? "task-panel--blackout" : ""}`}>
            <div className="task-panel-header">
              <span>{task.languageLabel}</span>
              <span>Real coding task</span>
            </div>
            {task.activeEditors?.length ? (
              <div className="editor-presence">
                Editing now: {task.activeEditors.join(", ")}
              </div>
            ) : null}
            <textarea
              className="code-editor"
              spellCheck="false"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              disabled={isSpectator}
            />
          </section>

          <section className="task-panel">
            <div className="task-panel-header">
              <span>Checks</span>
              <span>{task.visibleChecks.length} visible tests</span>
            </div>
            <div className="results-list">
              {task.visibleChecks.map((check) => (
                <div className="result-row" key={check}>
                  <strong>Spec</strong>
                  <span>{check}</span>
                </div>
              ))}
            </div>

            {runResult ? (
              <div className="results-list">
                {runResult.results.map((result) => (
                  <div className={`result-row ${result.passed ? "result-row--pass" : "result-row--fail"}`} key={result.name}>
                    <strong>{result.passed ? "Pass" : "Fail"}</strong>
                    <span>
                      {result.name}: {result.message}
                    </span>
                  </div>
                ))}
                <p className={`banner ${runResult.passed ? "" : "banner--danger"}`}>{runResult.summary}</p>
              </div>
            ) : null}

            {feedback ? <p className={`banner ${feedback.ok ? "" : "banner--danger"}`}>{feedback.message}</p> : null}
          </section>
        </div>

        <div className="button-row">
          <button className="button-secondary" disabled={isSpectator} onClick={() => onRun(task.id, { code })}>
            Run Code
          </button>
          <button disabled={isSpectator} onClick={() => onSubmit(task.id, { code })}>Submit Task</button>
        </div>
      </div>
    </div>
  );
}
