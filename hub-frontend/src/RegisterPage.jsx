import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error);
      return;
    }

    navigate("/login");
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleRegister}>
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
          Kayıt Ol
        </button>
      </form>
      <p>Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link></p>
    </div>
  );
}