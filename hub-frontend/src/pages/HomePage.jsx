import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const GAMES = [
  {
    id: "tower-of-hanoi",
    name: "Tower of Hanoi",
    owner: "Rahiq",
    url: import.meta.env.VITE_HANOI_URL || "http://localhost:3001",
    emoji: "🗼",
    color: "#5B8DEF",
    bg: "#E8EFFF",
  },
  {
    id: "eriksen-flanker-test",
    name: "Eriksen Flanker Test",
    owner: "Rahiq",
    url: import.meta.env.VITE_FLANKER_URL || "http://localhost:3007",
    emoji: "⬅️",
    color: "#F4A623",
    bg: "#FFF4E0",
  },
  {
    id: "simon-says-game",
    name: "Simon Says Task",
    owner: "Rahiq",
    url: import.meta.env.VITE_SIMON_URL || "http://localhost:3008",
    emoji: "🔵",
    color: "#3ECFB2",
    bg: "#E3FAF6",
  },
  {
    id: "digit-symbol-game",
    name: "Digit Symbol Task",
    owner: "Ilgın",
    url: import.meta.env.VITE_DIGIT_SYMBOL_URL || "http://localhost:3005",
    emoji: "🔣",
    color: "#F06060",
    bg: "#FFECEC",
  },
  {
    id: "colour-stroop-task",
    name: "Colour Stroop Task",
    owner: "Ilgın",
    url: import.meta.env.VITE_STROOP_URL || "http://localhost:3006",
    emoji: "🎨",
    color: "#E05CB5",
    bg: "#FCE8F6",
  },
  {
    id: "emotion-recognition",
    name: "Emotion Recognition",
    owner: "Ilgın",
    url: import.meta.env.VITE_EMOTION_URL || "http://localhost:3004",
    emoji: "🎭",
    color: "#E05CB5",
    bg: "#FCE8F6",
  },
  {
    id: "n-back-task",
    name: "N-Back Task",
    owner: "Ilgın",
    url: import.meta.env.VITE_NBACK_URL || "http://localhost:3003",
    emoji: "🧠",
    color: "#9B59B6",
    bg: "#F3E8FF",
  },
  {
    id: "go-no-go-game",
    name: "Go / No-Go Task",
    owner: "Ruken",
    url: import.meta.env.VITE_GONOGO_URL || "http://localhost:3013",
    emoji: "🚦",
    color: "#6c52b8",
    bg: "#F0EBFF",
  },

  {
    id: "target-tracking-game",
    name: "Target Tracking Task",
    owner: "Ruken",
    url: import.meta.env.VITE_TRACKING_URL || "http://localhost:3011",
    emoji: "🎯",
    color: "#4f6ef7",
    bg: "#EEF0FF",
  },
  {
    id: "typing-pressure-test",
    name: "Typing Pressure Test",
    owner: "Ruken",
    url: import.meta.env.VITE_TYPING_URL || "http://localhost:3012",
    emoji: "⌨️",
    color: "#c8401a",
    bg: "#FFF0EB",
  },
  {
    id: "balloon-task",
    name: "Balloon Task",
    owner: "Ece",
    url: import.meta.env.VITE_BALLOON_URL || "http://localhost:3002",
    emoji: "🎈",
    color: "#FF6B6B",
    bg: "#FFE8E8",
  },
  {
    id: "numbers-memory-game",
    name: "Number Memory",
    owner: "Ece",
    url: import.meta.env.VITE_MEMORY_URL || "http://localhost:3009",
    emoji: "🃏",
    color: "#E8703A",
    bg: "#FFF0E8",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="home">
      <header className="header">
        <div className="header-inner">
          <div className="logo">🎮</div>
          <div>
            <h1 className="title">Game Hub</h1>
            <p className="subtitle">Senior Design Project · 2026</p>
          </div>
        </div>
        <div className="header-user">
          <span className="user-name">👤 {user.username}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="main">
        <p className="pick-label">Choose a task</p>
        <div className="grid">
          {GAMES.map((game, i) => (
            <button
              key={game.id}
              className="card"
              style={{
                "--card-color": game.color,
                "--card-bg": game.bg,
                animationDelay: `${i * 60}ms`,
              }}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <span className="card-emoji">{game.emoji}</span>
              <span className="card-name">{game.name}</span>
              <span className="card-owner">{game.owner}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
