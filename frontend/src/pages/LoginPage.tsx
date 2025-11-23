import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() 
{
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Dev -> talk to local API; Prod -> use relative /api
  const apiBase =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api"
      : "/api";

  async function onSubmit(e: React.FormEvent) 
  {
    e.preventDefault();
    setMsg(null);

    if (!email || !password) 
    {
      setMsg({ text: "Please enter both email and password.", type: "error" });
      return;
    }

    setBusy(true);
    
    try 
    {
      const resp = await fetch(`${apiBase}/login`, 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: email, password }),
      });

      const raw = await resp.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch {}

      if (!resp.ok) 
      {
        throw new Error((data && data.error) || raw || `Login failed (${resp.status})`);
      }

      // ---- Normalize backend response shape ----
      // Your API sometimes returns: { jwtToken: { firstName, lastName, id, jwtToken } }
      // This extracts a STRING token and a user object with an id.
      let token = "";
      let u: any = {};

      if (typeof data?.jwtToken === "string") 
      {
        token = data.jwtToken;
        u = data.user || data || {};
      } 
      
      else if (data?.jwtToken && typeof data.jwtToken === "object") 
      {
        token = data.jwtToken.jwtToken || "";
        u = 
        {
          id:        data.jwtToken.id || data.jwtToken.userId || data.jwtToken._id,
          firstName: data.jwtToken.firstName,
          lastName:  data.jwtToken.lastName,
          email:     data.jwtToken.email
        };
      } 
      
      else 
      {
        u = data?.user || data || {};
      }

      const uid: string =
        u.id || u.userId || u._id || data?.id || data?._id || "";

      if (!token) throw new Error("No token returned from server.");

      // ---- Persist EXACTLY what /UserHome expects ----
      localStorage.setItem("jwtToken", String(token)); // must be a string (e.g., "eyJ...")
      
      localStorage.setItem
      (
        "user",
        JSON.stringify({
          id: uid,
          userId: uid,
          firstName: u.firstName || "",
          lastName:  u.lastName  || "",
          email
        })
      );

      setMsg({ text: `Welcome back, ${u.firstName || "knight"}!`, type: "success" });

      // small delay so user can see banner, then go to UserHome
      setTimeout(() => navigate("/UserHome", { replace: true }), 400);

    } 
    
    catch (err: any) 
    {
      setMsg({ text: err?.message || "Unable to sign in. Please try again.", type: "error" });
    } 
    
    finally 
    {
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
            <label htmlFor="email">Username</label>
            <input
              id="email"
              name="email"
              type="email"
              className="ft-input"
              placeholder="you@knights.ucf.edu"
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="ft-field">
            <div className="ft-row ft-row-compact">
              <label htmlFor="password">Password</label>
                <Link className="ft-link" to="/forgot-password">
                  Forgot password?
                </Link>
            </div>
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              className="ft-input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="ft-link ft-btnlink"
              onClick={() => setShowPwd(v => !v)}
            >
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
            {busy ? "Signing in..." : "Charge On!!!"}
          </button>
        </form>
      </section>
    </main>
  );
}

