export default function FriendsPanel({ members, meId, onSendCheer }) {
  const active = members
    .filter((m) => Date.now() - Number(m.updatedAtMs || 0) < 45000)
    .slice()
    .sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });

  return (
    <aside className="friends-panel card">
      <div className="friends-head">
        <h3>Room en direct</h3>
        <span>{active.length} en ligne</span>
      </div>

      <div className="friends-list">
        {!active.length && <p className="muted">Personne dans la room pour le moment.</p>}
        {active.map((m) => {
          const total = m.phase === "break" ? 300 : 1500;
          const left = Math.max(0, Math.min(total, m.timeLeft || total));
          const pct = Math.round(((total - left) / total) * 100);
          const phaseLabel = m.phase === "break" ? "Pause" : "Focus";
          const statusLabel = m.running ? `${phaseLabel} en cours` : `${phaseLabel} en pause`;
          return (
            <article key={m.id} className="friend-item">
              <div className="friend-top">
                <div>
                  <strong>
                    {m.name} {m.id === meId ? "(toi)" : ""}
                  </strong>
                  <small>{statusLabel}</small>
                </div>
                <span>{m.points || 0} pts</span>
              </div>
              <div className="bar-wrap">
                <div className="bar" style={{ width: `${pct}%` }} />
              </div>
              <small>Tache active: {m.currentTask || "Aucune"}</small>
              {m.id !== meId && (
                <div className="cheer-row">
                  {["☕", "🔥", "💪", "✨", "👏"].map((emoji) => (
                    <button key={emoji} className="cheer-btn" onClick={() => onSendCheer?.(m, emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
