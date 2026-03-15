import { LANGUAGE_OPTIONS } from "../data/languages.js";

export function LobbyScreen({
  form,
  onFormChange,
  onCreateRoom,
  onJoinRoom,
  roomState,
  onLanguageChange,
  onReadyToggle,
  onStartGame,
  isLoadingGemini,
  error
}) {
  const players = roomState?.players ?? [];
  const isHost = roomState?.hostId === roomState?.currentPlayerId;
  const everyoneReady = players.every((player) => player.isReady || player.isHost);
  const languageOptions = roomState?.supportedLanguages ?? LANGUAGE_OPTIONS;
  const selectedLanguage = roomState?.selectedLanguage ?? form.preferredLanguage;

  return (
    <div className="shell shell--lobby">
      <div className="lobby-left">
        <section className="hero-card">
          <p className="eyebrow">ULTIMATE CODE OFF GAME.</p>
          <h1>Code Sus</h1>
          <p className="lede">
            Move through a lab ship, solve quick OOP puzzles, and catch the bug-injecting hacker.
          </p>

          <div className="lobby-form">
            <label>
              Codename
              <input name="name" value={form.name} onChange={onFormChange} maxLength={16} />
            </label>
            <label>
              Room code
              <input name="roomId" value={form.roomId} onChange={onFormChange} maxLength={5} />
            </label>
          </div>

          <label className="full-width-label">
            Shared coding language
            <select
              name="preferredLanguage"
              value={selectedLanguage}
              onChange={onLanguageChange}
              disabled={Boolean(roomState) && !isHost}
            >
              {languageOptions.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <p className="helper-text">
            The host picks one language for the whole match. Everyone works in the same shared codebase.
          </p>

          <div className="button-row">
            <button onClick={onCreateRoom}>Create Room</button>
            <button className="button-secondary" onClick={onJoinRoom}>
              Join Room
            </button>
          </div>

          {error ? <p className="banner banner--danger">{error}</p> : null}
        </section>

        <section className="panel instructions-panel">
          <div className="panel-header" style={{ marginBottom: "16px" }}>
            <div>
              <p className="eyebrow">How to Play</p>
              <h2>Instructions</h2>
            </div>
          </div>

          <div className="instructions-roles">
            <div className="role-block">
              <h3 className="role-title role-title--codemate">👨‍💻 Codemate</h3>
              <ul className="role-list">
                <li>Explore the ship to find Task Nodes.</li>
                <li>Write OOP code to solve tasks (AI verifies your work).</li>
                <li>With 3+ Codemates: vote wrong, and the majority-voted player gets kicked out.</li>
                <li>Finish all tasks before the ship is sabotaged!</li>
              </ul>
            </div>

            <div className="role-block">
              <h3 className="role-title role-title--hacker">👾 Hacker</h3>
              <ul className="role-list">
                <li>Blend in! Use AI Sabotage Intel at task nodes to look busy.</li>
                <li>Delay Codemates by causing Blackouts, preventing them from coding.</li>
                <li>Win by deceiving the Codemates until the timer runs out.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Lobby</p>
            <h2>{roomState ? `Room ${roomState.roomId}` : "No active room"}</h2>
          </div>
          {roomState ? (
            <button className="button-secondary" onClick={() => onReadyToggle()}>
              {players.find((player) => player.id === roomState.currentPlayerId)?.isReady ? "Unready" : "Ready Up"}
            </button>
          ) : null}
        </div>

        <div className="player-list">
          {players.length === 0 ? <p>Join or create a room to see the crew.</p> : null}
          {players.map((player) => (
            <div className="player-row" key={player.id}>
              <span>{player.name}</span>
              <span>{player.isHost ? "Host" : player.isReady ? "Ready" : "Waiting"}</span>
            </div>
          ))}
        </div>

        {isHost && players.length >= 3 ? (
          <button onClick={onStartGame} disabled={!everyoneReady || isLoadingGemini}>
            {isLoadingGemini ? "Generating Match..." : "Launch Match"}
          </button>
        ) : null}

        <p className="helper-text">Need 3 to 8 players. The server stays authoritative over roles, movement, meetings, and task progress.</p>
      </section>
    </div>
  );
}
