import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/");
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <input
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Giriş Yap
        </button>
      </form>
      <p>Hesabın yok mu? <Link to="/register">Kayıt Ol</Link></p>
    </div>
  );
}