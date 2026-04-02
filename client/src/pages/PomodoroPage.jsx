import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FriendsPanel from "../components/FriendsPanel";
import LogoMark from "../components/LogoMark";
import { ensureRoom, upsertMember, watchMembers, sendCheer, watchCheers } from "../firebaseClient";

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function memberId() {
  const existing = localStorage.getItem("pf_member_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("pf_member_id", id);
  return id;
}

export default function PomodoroPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const meId = useMemo(() => memberId(), []);
  const name = localStorage.getItem("pf_name") || "";

  const [phase, setPhase] = useState("work");
  const [timeLeft, setTimeLeft] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);
  const [points, setPoints] = useState(0);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [cheers, setCheers] = useState([]);
  const [incomingCheer, setIncomingCheer] = useState("");
  const intervalRef = useRef(null);
  const lastCheerIdRef = useRef("");
  const syncStateRef = useRef({});

  const currentTask = useMemo(() => tasks.find((t) => !t.done)?.text || "", [tasks]);
  const shareLink = `${window.location.origin}/?room=${roomId}`;

  useEffect(() => {
    syncStateRef.current = {
      roomId,
      meId,
      name,
      phase,
      running,
      timeLeft,
      points,
      currentTask
    };
  }, [roomId, meId, name, phase, running, timeLeft, points, currentTask]);

  useEffect(() => {
    if (!name) navigate(`/?room=${encodeURIComponent(roomId)}`);
  }, [name, navigate, roomId]);

  useEffect(() => {
    let unsubscribe = null;
    let unsubscribeCheers = null;

    async function initRoom() {
      await ensureRoom(roomId, name || "unknown");
      await syncMember();
      unsubscribe = watchMembers(roomId, (items) => {
        const parsed = items.map((m) => ({
          ...m,
          updatedAtMs: m.updatedAt?.toMillis ? m.updatedAt.toMillis() : Date.now()
        }));
        setMembers(parsed);
      });
      unsubscribeCheers = watchCheers(roomId, (items) => {
        const parsed = items.map((c) => ({
          ...c,
          createdAtMs: c.createdAt?.toMillis ? c.createdAt.toMillis() : Date.now()
        }));
        setCheers(parsed);
      });
    }

    initRoom();

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeCheers) unsubscribeCheers();
    };
  }, [roomId]);

  useEffect(() => {
    if (!cheers.length) return;
    const latest = cheers[0];
    if (lastCheerIdRef.current === latest.id) return;
    lastCheerIdRef.current = latest.id;

    if (latest.toId === meId) {
      setIncomingCheer(`${latest.fromName || "Un ami"} t'a envoye ${latest.emoji || "✨"}`);
      const clear = setTimeout(() => setIncomingCheer(""), 2500);
      return () => clearTimeout(clear);
    }
  }, [cheers, meId]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (phase === "work") {
            setPoints((p) => p + 1);
            setPhase("break");
            return BREAK_SEC;
          }
          setPhase("work");
          return WORK_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  useEffect(() => {
    const timer = setInterval(() => {
      syncMember();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  async function syncMember() {
    const s = syncStateRef.current;
    if (!s.name) return;
    await upsertMember(s.roomId, s.meId, {
      name: s.name,
      phase: s.phase,
      running: s.running,
      timeLeft: s.timeLeft,
      points: s.points,
      currentTask: s.currentTask
    });
  }

  function toggleRun() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setTimeLeft(phase === "work" ? WORK_SEC : BREAK_SEC);
  }

  function skip() {
    setRunning(false);
    if (phase === "work") {
      setPhase("break");
      setTimeLeft(BREAK_SEC);
      return;
    }
    setPhase("work");
    setTimeLeft(WORK_SEC);
  }

  function switchPhase(next) {
    setRunning(false);
    setPhase(next);
    setTimeLeft(next === "work" ? WORK_SEC : BREAK_SEC);
  }

  function addTask() {
    const value = taskInput.trim();
    if (!value) return;
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), text: value, done: false }]);
    setTaskInput("");
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink);
    alert("Lien copie !");
  }

  async function handleSendCheer(targetMember, emoji) {
    await sendCheer(roomId, {
      fromId: meId,
      fromName: name,
      toId: targetMember.id,
      toName: targetMember.name,
      emoji
    });
  }

  const focusMinutes = Math.floor((points * WORK_SEC + (phase === "work" ? WORK_SEC - timeLeft : WORK_SEC)) / 60);

  return (
    <main className="app-layout">
      <section className="main-panel">
        <header className="top-row card">
          <div>
            <LogoMark compact />
            <p>Salut {name}, room: {roomId}</p>
          </div>
          <div className="top-actions">
            <button onClick={copyLink}>Copier lien</button>
            <button onClick={() => navigate("/")}>Changer room</button>
          </div>
        </header>

        <section className="timer-box card">
          <div className="phase-tabs">
            <button className={phase === "work" ? "active" : ""} onClick={() => switchPhase("work")}>Focus</button>
            <button className={phase === "break" ? "active" : ""} onClick={() => switchPhase("break")}>Pause</button>
          </div>
          <h1>{formatTime(timeLeft)}</h1>
          <p>{phase === "work" ? "Mode Focus" : "Mode Pause"}</p>

          <div className="timer-actions">
            <button onClick={reset}>Reset</button>
            <button className="primary" onClick={toggleRun}>{running ? "Pause" : "Start"}</button>
            <button onClick={skip}>Skip</button>
          </div>

          <div className="stats-grid">
            <article>
              <strong>{points}</strong>
              <span>Points</span>
            </article>
            <article>
              <strong>{focusMinutes}</strong>
              <span>Min focus</span>
            </article>
            <article>
              <strong>{tasks.filter((t) => t.done).length}</strong>
              <span>Taches finies</span>
            </article>
          </div>
        </section>

        <section className="tasks-box card">
          <h3>Mes taches</h3>
          <div className="task-add-row">
            <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Ajouter une tache" />
            <button onClick={addTask}>Ajouter</button>
          </div>
          <div className="task-list">
            {!tasks.length && <p className="muted">Aucune tache pour le moment.</p>}
            {tasks.map((task) => (
              <div key={task.id} className={`task-row ${task.done ? "done" : ""}`}>
                <button onClick={() => toggleTask(task.id)}>{task.done ? "✓" : "○"}</button>
                <span>{task.text}</span>
                <button onClick={() => deleteTask(task.id)}>x</button>
              </div>
            ))}
          </div>
        </section>

        <section className="card cheers-feed">
          <h3>Encouragements</h3>
          {!cheers.length && <p className="muted">Pas encore de cheers dans cette room.</p>}
          <div className="cheers-list">
            {cheers.map((c) => (
              <p key={c.id} className="cheer-line">
                <strong>{c.fromName || "Ami"}</strong> a envoye <span>{c.emoji || "✨"}</span> a <strong>{c.toName || "room"}</strong>
              </p>
            ))}
          </div>
        </section>
      </section>

      <FriendsPanel members={members} meId={meId} onSendCheer={handleSendCheer} />
      {incomingCheer && <div className="incoming-cheer">{incomingCheer}</div>}
    </main>
  );
}
