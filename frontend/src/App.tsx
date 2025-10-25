import { FormEvent, useState } from "react";
import { postJSON } from "./api";
import { getToken, setToken, clearToken } from "./tokenStorage";

export default function App() 
{
  const [login, setLogin] = useState("nick@example.com");
  const [password, setPassword] = useState("test123");

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState(260);
  const [notes, setNotes] = useState("pm weigh-in");

  const [message, setMessage] = useState("");

  async function onLogin(e: FormEvent) 
    {
      e.preventDefault();
      setMessage("");
      
      const resp = await postJSON<{ accessToken?: string; error?: string }>
        (
          "/api/auth/login",
          { login, password }
        );

      if (resp.accessToken) 
        {
          setToken(resp.accessToken);
          setMessage("Logged in.");
        } 
        
        else 
          setMessage(resp.error || "Login failed");
    }

  async function onAddWeight(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const jwtToken = getToken();
    if (!jwtToken) return setMessage("Please login first.");
    const resp = await postJSON<{ error?: string; jwtToken?: string }>(
      "/api/bodyweight",
      { date, weight, notes, jwtToken }
    );
    if (resp.error) setMessage(resp.error);
    else if (resp.jwtToken) {
      setToken(resp.jwtToken); // refresh
      setMessage("Saved weight entry.");
    }
  }

  function onLogout() {
    clearToken();
    setMessage("Logged out.");
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", margin: 24, display: "grid", gap: 24 }}>
      <h1>Weight Tracker (MERN)</h1>
      {message && <div style={{ padding: 8, border: "1px solid #ddd" }}>{message}</div>}

      <section style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
        <h2>Login</h2>
        <form onSubmit={onLogin} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
          <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          <button type="submit">Login</button>
          <button type="button" onClick={onLogout}>Logout</button>
        </form>
      </section>

      <section style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
        <h2>Add Body Weight</h2>
        <form onSubmit={onAddWeight} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="notes" />
          <button type="submit">Save</button>
        </form>
      </section>
    </div>
  );
}
