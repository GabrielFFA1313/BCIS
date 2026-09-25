import { useState } from "react";

interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setToken(data.token);
      setUser(data.user);
    } catch {
      setError("Could not reach the API. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setUsername("");
    setPassword("");
  }

  // ── Logged in: show a minimal dashboard placeholder ──
  if (token && user) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h2>Welcome, {user.fullName}</h2>
        <p>Username: {user.username}</p>
        <p>Roles: {user.roles.join(", ")}</p>
        <p>Permissions: {user.permissions.join(", ")}</p>

        {user.permissions.includes("user.manage") && (
          <button style={{ marginRight: 8 }}>Manage Users (admin only)</button>
        )}

        <button onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  // ── Not logged in: show the login form ──
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 320 }}>
      <h2>BCIS Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 10 }}>
          <label>Username</label>
          <br />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: "6px 16px" }}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}

export default App;