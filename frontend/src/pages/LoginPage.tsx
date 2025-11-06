import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const apiBase =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api"
      : "/api";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg({ text: "Please enter both email and password.", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const resp = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: email, password }),
      });
      const raw = await resp.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch {}

      if (!resp.ok) throw new Error(data?.error || raw || `Login failed (${resp.status})`);

      const { jwtToken, firstName, lastName, id } = data || {};
      if (!jwtToken) throw new Error("No token returned from server.");

      // persist
      localStorage.setItem("jwtToken", jwtToken);
      localStorage.setItem("user", JSON.stringify({ firstName, lastName, id, userId: id, email }));

      setMsg({ text: `Welcome back, ${firstName || "knight"}!`, type: "success" });
      setTimeout(() => navigate("/UserHome", { replace: true }), 500);
    } catch (err: any) {
      setMsg({ text: err?.message || "Unable to sign in. Please try again.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ft-container" role="main">
      <section className="ft-hero" aria-labelledby="welcomeHeading">
        <div className="ft-crest" aria-hidden="true" />
        <h1 id="welcomeHeading">Welcome to FormaTrack</h1>
        <p className="ft-tag">
          Forged at UCF — where precision meets purpose.<br />Log in below to begin your training.
        </p>
        <footer className="ft-footer">© 2025 FormaTrack • Crafted with honor and steel</footer>
      </section>

      <section className="ft-card" aria-labelledby="loginHeading">
        <h2 id="loginHeading" className="ft-title">Sign in to your account</h2>
        <div aria-live="polite" className={msg ? `ft-banner ${msg.type}` : "ft-banner"}>
          {msg?.text ?? "\u00A0"}
        </div>

        <form className="ft-form" onSubmit={onSubmit} noValidate>
          <div className="ft-field">
            <label htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email" className="ft-input"
              placeholder="you@knights.ucf.edu" autoComplete="username email"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>

          <div className="ft-field">
            <div className="ft-row ft-row-compact">
              <label htmlFor="password">Password</label>
              <a className="ft-link" href="/forgot">Forgot password?</a>
            </div>
            <input
              id="password" name="password" type={showPwd ? "text" : "password"} className="ft-input"
              placeholder="••••••••" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
            <button type="button" className="ft-link ft-btnlink" onClick={() => setShowPwd(v=>!v)}>
              {showPwd ? "Hide password" : "Show password"}
            </button>
          </div>

          <div className="ft-row">
            <label className="ft-check">
              <input type="checkbox" disabled /> <span>Remember me</span>
            </label>
            <a className="ft-link" href="/RegistrationPage">Create account</a>
          </div>

          <button className="ft-btn" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
