export default function LogoMark({ compact = false }) {
  return (
    <div className={`logo-wrap ${compact ? "compact" : ""}`}>
      <div className="logo-orb">
        <span>PF</span>
      </div>
      <div className="logo-text">
        <strong>PomoFriends</strong>
        {!compact && <small>Focus together, grow together</small>}
      </div>
    </div>
  );
}
