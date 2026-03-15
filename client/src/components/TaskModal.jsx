import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export function TaskModal({ task, code, onCodeChange, onClose, onRun, onSubmit, feedback, runResult, isBlackout, canBypassBlackout, isSpectator }) {
  const editorRef = useRef(null);
  const selectionRef = useRef({ start: null, end: null });
  const [remoteMarkers, setRemoteMarkers] = useState([]);
  const remoteCursors = useMemo(() => {
    return (task?.cursors ?? []).filter((cursor) => cursor.playerId !== currentPlayerId);
  }, [task?.cursors, currentPlayerId]);

  useEffect(() => {
    selectionRef.current = { start: null, end: null };
    setRemoteMarkers([]);
  }, [task?.id]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    const selection = selectionRef.current;
    if (!editor || document.activeElement !== editor) {
      return;
    }

    if (selection.start === null || selection.end === null) {
      return;
    }

    const nextStart = Math.min(selection.start, code.length);
    const nextEnd = Math.min(selection.end, code.length);
    editor.setSelectionRange(nextStart, nextEnd);
  }, [code]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || !task) {
      return;
    }

    const refreshMarkers = () => {
      const markers = remoteCursors
        .filter((cursor) => typeof cursor?.start === "number")
        .map((cursor) => {
          const position = Math.max(0, Math.min(cursor.start, code.length));
          const caret = getCaretCoordinates(editor, position);
          return {
            playerId: cursor.playerId,
            name: cursor.name,
            top: caret.top,
            left: caret.left,
            color: getCursorColor(cursor.playerId ?? cursor.name)
          };
        });

      setRemoteMarkers(markers);
    };

    refreshMarkers();
    editor.addEventListener("scroll", refreshMarkers);
    window.addEventListener("resize", refreshMarkers);

    return () => {
      editor.removeEventListener("scroll", refreshMarkers);
      window.removeEventListener("resize", refreshMarkers);
    };
  }, [task, remoteCursors, code]);

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
              ref={editorRef}
              className="code-editor"
              spellCheck="false"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              onSelect={(event) => {
                selectionRef.current = {
                  start: event.target.selectionStart,
                  end: event.target.selectionEnd
                };
              }}
              disabled={isSpectator}
            />
            {isBlackout && !canBypassBlackout ? (
              <div className="blackout-mask">
                <strong>Blackout</strong>
                <span>Your workspace is offline.</span>
              </div>
            ) : null}
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

function getCursorColor(seed) {
  const hash = String(seed ?? "").split("").reduce((value, char) => value + char.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

function getCaretCoordinates(textarea, position) {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const marker = document.createElement("span");

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordBreak = "break-word";
  mirror.style.overflow = "hidden";
  mirror.style.fontFamily = style.fontFamily;
  mirror.style.fontSize = style.fontSize;
  mirror.style.fontWeight = style.fontWeight;
  mirror.style.fontStyle = style.fontStyle;
  mirror.style.letterSpacing = style.letterSpacing;
  mirror.style.lineHeight = style.lineHeight;
  mirror.style.padding = style.padding;
  mirror.style.border = style.border;
  mirror.style.width = `${textarea.clientWidth}px`;

  const safePosition = Math.max(0, Math.min(position, textarea.value.length));
  mirror.textContent = textarea.value.slice(0, safePosition);
  marker.textContent = textarea.value[safePosition] || " ";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const top = marker.offsetTop - textarea.scrollTop;
  const left = marker.offsetLeft - textarea.scrollLeft;

  document.body.removeChild(mirror);
  return { top, left };
}
