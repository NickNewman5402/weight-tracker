import { useState } from "react";
import type { FormEvent } from "react";
import HeaderBar from "../components/HeaderBar";
import { getStoredUser } from "../lib/auth";
import "./UserHome.css";
import RecentEntries from "../components/RecentEntries";



export default function UserHome() 
{
  const user = getStoredUser();
  const firstName = user?.firstName || user?.firstName || "";

  // Quick add weigh-in form state
  const [qaDate, setQaDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [qaWeight, setQaWeight] = useState<string>("");
  const [qaNote, setQaNote] = useState<string>("");
  const [qaMessage, setQaMessage] = useState<string>("");
  const [recentRefreshKey, setRecentRefreshKey] = useState<number>(0);     // Trigger refetch of recent weigh-ins when this changes


  async function handleQuickAdd(e: FormEvent) 
  {
      e.preventDefault();
      setQaMessage("");

      if (!qaDate || !qaWeight) 
      {
        setQaMessage("Please enter a date and weight.");
        return;
      }

      try 
      {
        // This key matches what LoginPage.tsx stores:
        const jwtToken = localStorage.getItem("jwtToken");

        if (!jwtToken) 
        {
          setQaMessage("You are not logged in.");
          return;
        }

        const resp = await fetch("/api/weights", 
                                  {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${jwtToken}`,
                                      },
                                      body: JSON.stringify({
                                        date: qaDate,
                                        weight: Number(qaWeight),
                                        note: qaNote || undefined,
                                      }),
                                  }
                                );

        if (!resp.ok) 
        {
          const data = await resp.json().catch(() => ({}));
          const msg = data.error || `Error: ${resp.status}`;
          setQaMessage(msg);
          return;
        }

        const data = await resp.json();
        console.log("Saved weigh-in:", data.weighIn);

        setQaMessage("Weigh-in saved!");
        setQaWeight("");
        setQaNote("");
        setRecentRefreshKey((prev) => prev + 1); // Tell RecentEntries to refetch
      } 
      
      catch (err) 
      {
        console.error(err);
        setQaMessage("Network error saving weigh-in.");
      }
}




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
                <h2>Recent Weigh-Ins</h2>
              </div>
            <RecentEntries refreshKey={recentRefreshKey} />
          </div>

          </div>

          <aside className="ft-user-right">
           <div className="ft-panel">
              <div className="ft-panel-header">
                <h2>Daily Weigh-in</h2>
              </div>

              {qaMessage && (
                <div className="ft-qa-message">
                  {qaMessage}
                </div>
              )}

              <form className="ft-qa-form" onSubmit={handleQuickAdd}>
                <label className="ft-qa-field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={qaDate}
                    onChange={(e) => setQaDate(e.target.value)}
                  />
                </label>

                <label className="ft-qa-field">
                  <span>Weight (lbs)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={qaWeight}
                    onChange={(e) => setQaWeight(e.target.value)}
                    placeholder="e.g. 261.4"
                  />
                </label>

                <label className="ft-qa-field">
                  <span>Note (optional)</span>
                  <textarea
                    rows={2}
                    value={qaNote}
                    onChange={(e) => setQaNote(e.target.value)}
                    placeholder="Morning, after run, etc."
                  />
                </label>

                <button className="ft-btn ft-btn-primary" type="submit">
                  Save weigh-in
                </button>
              </form>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
