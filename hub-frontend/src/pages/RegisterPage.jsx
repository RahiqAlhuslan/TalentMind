import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎮</div>
        <h1 className="auth-title">Game Hub</h1>
        <p className="auth-subtitle">Create your account</p>

        <form onSubmit={handleRegister} className="auth-form">
          <input
            className="auth-input"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
