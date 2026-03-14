export function RoleRevealModal({ role, onClose }) {
  if (!role) {
    return null;
  }

  const isImposter = role === "Imposter";

  return (
    <div className="overlay">
      <div className={`modal role-reveal ${isImposter ? "role-reveal--imposter" : "role-reveal--codemate"}`}>
        <p className="eyebrow">Role assigned</p>
        <h2>{isImposter ? "YOU'RE THE IMPOSTER" : "YOU'RE A CODEMATE"}</h2>
        <p>
          {isImposter
            ? "Blend in, fake progress, sabotage the OOP system, and survive the vote."
            : "Repair the system architecture, finish real coding tasks, and identify the saboteur."}
        </p>
        <button onClick={onClose}>Enter The Ship</button>
      </div>
    </div>
  );
}
