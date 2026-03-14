export function EndScreen({ roomState, onReset }) {
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
        <button onClick={onReset}>Back To Lobby</button>
      </div>
    </div>
  );
}
