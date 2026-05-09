import { useState } from "react";
import { login } from "../api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = await login(username, password);
      onLogin(payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="form-card login-card">
        <h2>Sign in</h2>
        <p className="muted">
          Demo: <strong>admin</strong> / admin123 · <strong>sales</strong> /
          sales123 · <strong>inventory</strong> / inventory123 ·{" "}
          <strong>accounting</strong> / accounting123
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
