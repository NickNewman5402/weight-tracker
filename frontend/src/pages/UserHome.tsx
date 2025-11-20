//import React from "react";
import HeaderBar from "../components/HeaderBar";
import { getStoredUser } from "../lib/auth";
import "./UserHome.css";


export default function UserHome() {
  const user = getStoredUser();
  const firstName = user?.firstName || user?.firstName || "";

  function handleLogout() {
    // You can refine this later to match your actual auth flow
    localStorage.removeItem("token_data");
    localStorage.removeItem("user_data");
    window.location.href = "/login";
  }

  return (
    <div className="ft-page ft-user-page">
      {/* Top header bar (already part of your app) */}
      <HeaderBar name={firstName} onLogout={handleLogout} />

      <main className="ft-user-main">
        {/* Top summary strip */}
        <section className="ft-user-summary">
          <div className="ft-card">
            <div className="ft-card-label">Current weight / etc.</div>
            <div className="ft-card-value">[placeholder]</div>
          </div>

          <div className="ft-card">
            <div className="ft-card-label">Goal / progress</div>
            <div className="ft-card-value">[placeholder]</div>
          </div>

          <div className="ft-card">
            <div className="ft-card-label">Trend / streak</div>
            <div className="ft-card-value">[placeholder]</div>
          </div>
        </section>

        {/* Body: left = graph + recent, right = quick add */}
        <section className="ft-user-body">
          <div className="ft-user-left">
            <div className="ft-panel">
              <div className="ft-panel-header">
                <h2>Graph area</h2>
              </div>
              <div className="ft-panel-placeholder">
                Graph will go here.
              </div>
            </div>

            <div className="ft-panel">
              <div className="ft-panel-header">
                <h2>Recent entries</h2>
              </div>
              <div className="ft-panel-placeholder">
                Recent entries table will go here.
              </div>
            </div>
          </div>

          <aside className="ft-user-right">
            <div className="ft-panel">
              <div className="ft-panel-header">
                <h2>Quick add weigh-in</h2>
              </div>
              <div className="ft-panel-placeholder">
                Quick add form will go here.
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
