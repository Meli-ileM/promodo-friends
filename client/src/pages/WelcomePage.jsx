import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ensureRoom, initFirebase, roomExists } from "../firebaseClient";
import LogoMark from "../components/LogoMark";

function roomCode() {
  return `room-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const incomingRoom = useMemo(() => search.get("room") || "", [search]);

  const [name, setName] = useState(localStorage.getItem("pf_name") || "");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue(e) {
    e.preventDefault();
    setMsg("");

    if (!name.trim()) {
      setMsg("Entre ton nom.");
      return;
    }

    setLoading(true);

    try {
      initFirebase();
      localStorage.setItem("pf_name", name.trim());

      const roomId = incomingRoom || roomCode();
      if (incomingRoom) {
        const exists = await roomExists(roomId);
        if (!exists) throw new Error("Room introuvable.");
      } else {
        await ensureRoom(roomId, name.trim());
      }

      navigate(`/room/${encodeURIComponent(roomId)}`);
    } catch (err) {
      setMsg(err.message || "Erreur de connexion Firebase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-page">
      <section className="card intro-card">
        <LogoMark />
        <p>
          Ecris ton nom puis cree ou rejoins une room.
          Si un lien room est present, tu rejoins directement cette room.
        </p>
        <form onSubmit={handleContinue} className="form-grid">
          <label>
            Ton nom
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="melissa_01" />
          </label>

          <div className="room-banner">
            {incomingRoom ? `Room detectee: ${incomingRoom}` : "Aucune room dans l'URL: une room sera creee."}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Continuer"}
          </button>

          {msg && <div className="error-box">{msg}</div>}
        </form>
      </section>
    </main>
  );
}
