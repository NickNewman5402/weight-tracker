//import React from "react";
import HeaderBar from "../components/HeaderBar";
// adjust path if your CardUI lives elsewhere
import CardUI from "../components/CardUI";
import { Navigate } from "react-router-dom";

// mini helpers (or import from src/lib/auth if you made it)
function getStoredUser(): any | null {
  const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function getStoredToken(): string | null {
  return localStorage.getItem("jwtToken") ?? sessionStorage.getItem("jwtToken");
}

export default function UserHome() {
  const token = getStoredToken();
  const user = getStoredUser();
  const userId = user?.id ?? user?.userId;

  if (!token || !userId) {
    return <Navigate to="/" replace />;
  }

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/"); // or navigate("/")
  }

  return (
    <div className="ft-wrap">
      <HeaderBar name={name} onLogout={handleLogout} />
      <section className="ft-card">
        {/* Your existing Cards UI lives here unchanged */}
        <CardUI />
      </section>
    </div>
  );
}
