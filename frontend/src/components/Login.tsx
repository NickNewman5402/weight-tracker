import React, { useState } from "react";
import "./Login.css"; // CSS extracted from the style tag

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [remember, setRemember] = useState(false);

  const apiBase =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api"
      : "/api";

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Login failed");
      const { jwtToken, firstName, lastName, id } = data;
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("jwtToken", jwtToken);
      storage.setItem("user", JSON.stringify({ firstName, lastName, id, email }));
      setMsg(`Welcome back, ${firstName || "knight"}!`);
      setTimeout(() => (window.location.href = "/app"), 800);
    } catch (err: any) {
      setMsg(err.message || "Unable to sign in.");
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <div className="crest" aria-hidden="true"></div>
        <h1>Welcome to FormaTrack</h1>
        <p className="tag">
          Forged at UCF — where precision meets purpose.<br />
          Log in below to begin your training.
        </p>
      </section>

      <section className="login-card">
        <h2 className="login-title">Sign in to your account</h2>
        {msg && <div className="message">{msg}</div>}

        <form onSubmit={doLogin}>
          <label>Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <a href="/register" className="link">
              Create account
            </a>
          </div>

          <button className="btn" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
