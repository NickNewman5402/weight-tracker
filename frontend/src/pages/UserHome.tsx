import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import HeaderBar from "../components/HeaderBar";
import { getStoredUser } from "../lib/auth";
import "./UserHome.css";
import RecentEntries from "../components/RecentEntries";
import WeightTrendChart from "../components/WeightTrendChart";


type WeighIn = {
  _id?: string;
  date: string;
  weight: number;
  note?: string;
};



/*****************************************************************************************************************************
 *                                                                                                                          * 
 *                                                  HELPER FUNCTIONS                                                        *
 *                                                                                                                          *
*****************************************************************************************************************************/



/*****************************************************************************************************************************
 * 
 *                                                  get7DayTrend
 * 
*****************************************************************************************************************************/
  
  // 7-day trend: how many lbs up/down over last ~7 days

  function get7DayTrend(weighIns: WeighIn[]): number | null 
{
  if (weighIns.length < 2) return null;

  // assume weighIns is oldest → newest, but make a copy just in case
  const sorted = [...weighIns].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const latestTime = new Date(latest.date).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // keep only entries in the last 7 days relative to latest
  const window = sorted.filter(
    (w) => new Date(w.date).getTime() >= latestTime - sevenDaysMs
  );

  if (window.length < 2) return null;

  const first = window[0];
  return latest.weight - first.weight; // >0 = gain, <0 = loss
}


/*****************************************************************************************************************************
 * 
 *                                                  getStreak
 * 
*****************************************************************************************************************************/
  
  // streak: consecutive days with at least one weigh-in (ending at latest)

  function getStreak(weighIns: WeighIn[]): number 
{
  if (weighIns.length === 0) return 0;

  // unique date strings (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(weighIns.map((w) => w.date.slice(0, 10)))
  ).sort(); // ascending

  let streak = 1;
  for (let i = uniqueDates.length - 1; i > 0; i--) {
    const curr = new Date(uniqueDates[i]);
    const prev = new Date(uniqueDates[i - 1]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break; // streak broken
    }
  }

  return streak;
}




  /*****************************************************************************************************************************
   *                                                                                                                          *
   *                                                  USER HOME FUNCTIONS                                                     *
   *                                                                                                                          *
   *****************************************************************************************************************************/

export default function UserHome() 
{
  const user = getStoredUser();
  const firstName = user?.firstName || user?.firstName || "";

  // Goal weight state (init from stored user if present)
  const [goalWeight, setGoalWeight] = useState<number | null>( user?.goalWeight ?? null);


  // Quick add weigh-in form state
  const [qaDate, setQaDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [qaWeight, setQaWeight] = useState<string>("");
  const [qaNote, setQaNote] = useState<string>("");
  const [qaMessage, setQaMessage] = useState<string>("");
  const [recentRefreshKey, setRecentRefreshKey] = useState<number>(0); // Trigger refetch of recent weigh-ins when this changes
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [latestWeight, setLatestWeight] = useState<WeighIn | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState<string>("");
  const [goalMessage, setGoalMessage] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editWeightInput, setEditWeightInput] = useState<string>("");
  const [editDateDisplay, setEditDateDisplay] = useState<string>("");
  const [editMessage, setEditMessage] = useState<string>("");


  // keep the input in sync with whatever goalWeight we currently have
  useEffect(() => {
    if (goalWeight !== null) {
      setGoalInput(goalWeight.toString());
    }
  }, [goalWeight]);


  
  /*****************************************************************************************************************************
   * 
   *                                                  useEffect... fetchWeighIns
   * 
  *****************************************************************************************************************************/
  // Fetch all weigh-ins for the graph
  // Fetch all weigh-ins for the graph + latest weight card

  useEffect(() => {
  const fetchWeighIns = async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const resp = await fetch("/api/weights/recent?limit=50", {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!resp.ok) {
        console.error("Failed to fetch weights", resp.status);
        return;
      }

      const data = await resp.json();
      console.log("Weights API response:", data);

      // Get an array out of whatever shape the backend sent
      const arr = Array.isArray(data)
        ? data
        : data.weighIns || data.weights || data.entries || [];

      if (!Array.isArray(arr)) {
        console.error("Weights response is not an array:", data);
        return;
      }

      // Oldest → newest (by date)
      const sorted = [...arr].sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const normalized: WeighIn[] = sorted.map((w: any) => ({
        _id: w._id,
        date: w.date,
        weight: Number(w.weight),
        note: w.note,
      }));

      setWeighIns(normalized);

      // 👇 last item is the newest by date
      setLatestWeight(
        normalized.length > 0 ? normalized[normalized.length - 1] : null
      );

    } catch (err) {
      console.error("Error fetching weigh-ins:", err);
    }
  };

  fetchWeighIns();
}, [recentRefreshKey]);




  const sevenDayTrend = get7DayTrend(weighIns);
  const streakDays = getStreak(weighIns);


  // --- Goal / Progress calculations ---
  const startingWeight =
  weighIns.length > 0 ? weighIns[0].weight : null;
  const currentWeight = latestWeight?.weight ?? null;


  let goalSubline: string | null = null;
  let percentToGoal: number | null = null;

  if (
    goalWeight !== null &&
    startingWeight !== null &&
    currentWeight !== null &&
    startingWeight !== goalWeight
  ) {
    const isLosing = startingWeight > goalWeight;
    const totalDelta = Math.abs(startingWeight - goalWeight);
    const achievedDelta = Math.abs(currentWeight - startingWeight);
    const clampedAchieved = Math.min(achievedDelta, totalDelta);

    percentToGoal = (clampedAchieved / totalDelta) * 100;

    if (isLosing) {
      const remaining = currentWeight - goalWeight;
      goalSubline =
        remaining <= 0
          ? `Goal reached! (${percentToGoal.toFixed(0)}% of target)`
          : `${remaining.toFixed(1)} lbs to goal (${percentToGoal.toFixed(
              0
            )}% complete)`;
    } else {
      const remaining = goalWeight - currentWeight;
      goalSubline =
        remaining <= 0
          ? `Goal reached! (${percentToGoal.toFixed(0)}% of target)`
          : `${remaining.toFixed(1)} lbs to goal (${percentToGoal.toFixed(
              0
            )}% complete)`;
    }
  }


  /*****************************************************************************************************************************
   * 
   *                                                  handleQuickAdd
   * 
   *****************************************************************************************************************************/

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


  /*****************************************************************************************************************************
   * 
   *                                                  handleLogout
   * 
   *****************************************************************************************************************************/

  function handleLogout() {
    // You can refine this later to match your actual auth flow
    localStorage.removeItem("token_data");
    localStorage.removeItem("user_data");
    window.location.href = "/login";
  }

  /*****************************************************************************************************************************
   * 
   *                                                  handleSaveGoal
   * 
   *****************************************************************************************************************************/

    async function handleSaveGoal(e: FormEvent) {
    e.preventDefault();
    setGoalMessage("");

    const parsed = parseFloat(goalInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setGoalMessage("Please enter a valid positive number.");
      return;
    }

    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      setGoalMessage("You are not logged in.");
      return;
    }

    try {
      const resp = await fetch("http://localhost:5000/api/users/goal", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ goalWeight: parsed }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data.error || `Error: ${resp.status}`;
        setGoalMessage(msg);
        return;
      }

      const data = await resp.json();

      // Backend returns updated user as data.user
      if (data.user) {
        localStorage.setItem("user_data", JSON.stringify(data.user));
      }

      // ✅ Update state so the Goal / Progress card reacts immediately
      setGoalWeight(parsed);
      setGoalMessage("Goal updated!");
      setIsGoalModalOpen(false);
    } catch (err) {
      console.error(err);
      setGoalMessage("Network error saving goal.");
    }
  }

function openEditModal(entry: WeighIn) {
  // Open the modal and pre-fill fields from the entry
  setIsEditModalOpen(true);
  setEditRecordId(entry._id || null);
  setEditWeightInput(entry.weight.toString());
  setEditDateDisplay(entry.date.slice(0, 10)); // YYYY-MM-DD
  setEditMessage("");
}

function closeEditModal() {
  // Close + reset modal state
  setIsEditModalOpen(false);
  setEditRecordId(null);
  setEditWeightInput("");
  setEditDateDisplay("");
  setEditMessage("");
}

async function handleSaveEditedWeight(e: FormEvent) 
{

  e.preventDefault();
  setEditMessage("");

  if (!editRecordId) {
    setEditMessage("Missing record id.");
    return;
  }

  const parsed = parseFloat(editWeightInput);
  if (Number.isNaN(parsed) || parsed <= 0) {
    setEditMessage("Please enter a valid positive number.");
    return;
  }

  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    setEditMessage("You are not logged in.");
    return;
  }

  try {
    // 🔁 Uses a standard REST-style endpoint; if your current
    // edit code uses a slightly different URL, we can tweak later.
    const resp = await fetch(`/api/weights/${editRecordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ weight: parsed }),
    });

    if (!resp.ok) 
    {
      const data = await resp.json().catch(() => ({}));
      const msg = data.error || `Error: ${resp.status}`;
      setEditMessage(msg);
      return;
    }

    // Success → close modal + refresh RecentEntries / graph
    setIsEditModalOpen(false);
    setEditRecordId(null);
    setEditWeightInput("");
    setEditDateDisplay("");
    setEditMessage("");
    setRecentRefreshKey((prev) => prev + 1);

  } catch (err) {
    console.error("Error updating weigh-in:", err);
    setEditMessage("Network error updating weigh-in.");
  }
}



  
  /*****************************************************************************************************************************
   * 
   *                                                  RETURN
   * 
   *****************************************************************************************************************************/

  return (
    <div className="ft-page ft-user-page">
      {/* Top header bar (already part of your app) */}
      <HeaderBar
        name={firstName}
        onLogout={handleLogout}
        onEditGoal={() => {
          setGoalMessage("");
          setIsGoalModalOpen(true);
        }}
      />


      <main className="ft-user-main">
        {/* Top summary strip */}
        <section className="ft-user-summary">
          <div className="ft-card">
            <div className="ft-card-label">Current weight / etc.</div>
            <div className="ft-card-value">
              {latestWeight ? `${latestWeight.weight} lbs` : "—"}
            </div>
            </div>

            <div className="ft-card">
              <div className="ft-card-label">Goal / progress</div>
              <div className="ft-card-value">
                {goalWeight == null ? (
                  // 1) No goal set yet
                  <span>Set a goal in your profile to track progress.</span>
                ) : startingWeight == null || currentWeight == null ? (
                  // 2) Goal set, but no weigh-ins yet
                  <span>
                    Goal set: {goalWeight.toFixed(1)} lbs. Add weigh-ins to track your progress.
                  </span>
                ) : (
                  // 3) Goal + weights present → show full progress
                  <>
                    <span>
                      {currentWeight.toFixed(1)} / {goalWeight.toFixed(1)} lbs
                    </span>
                    {goalSubline && <span>{goalSubline}</span>}
                  </>
                )}
              </div>

            </div>



          <div className="ft-card">
            <div className="ft-card-label">Trend / streak</div>
            <div className="ft-card-value">
              {/* Trend text */}
              {sevenDayTrend === null ? (
                <span>Not enough data yet</span>
              ) : sevenDayTrend === 0 ? (
                <span>Flat past 7 days</span>
              ) : sevenDayTrend < 0 ? (
                <span>Down {Math.abs(sevenDayTrend).toFixed(1)} lbs (7 days)</span>
              ) : (
                <span>Up {sevenDayTrend.toFixed(1)} lbs (7 days)</span>
              )}
              <br />
              {/* Streak text */}
              <span>
                {streakDays > 0
                  ? `${streakDays}-day weigh-in streak`
                  : "No streak yet"}
              </span>
            </div>
          </div>
        </section>

        {/* Body: left = graph + recent, right = quick add */}
        <section className="ft-user-body">
          <div className="ft-user-left">
            <div className="ft-panel">
              <div className="ft-panel-header">
                <h2>Graph area</h2>
              </div>
              <div style={{ padding: "10px 0" }}>
                <WeightTrendChart weighIns={weighIns} />
              </div>
            </div>

            <div className="ft-panel">
              <div className="ft-panel-header">
                <h2>Recent Weigh-Ins</h2>
              </div>
            <RecentEntries 
              refreshKey={recentRefreshKey} 
              onEditEntry={openEditModal}
            />
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
        {/* Edit Weigh-in modal */}
        {isEditModalOpen && (
          <div className="ft-modal-backdrop">
            <div className="ft-modal">
              <h2 className="ft-modal-title">Edit weigh-in</h2>

              <form onSubmit={handleSaveEditedWeight} className="ft-modal-form">
                {editDateDisplay && (
                  <p className="ft-modal-subtitle">
                    Entry date: {editDateDisplay}
                  </p>
                )}

                <label className="ft-qa-field">
                  <span>Weight (lbs)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editWeightInput}
                    onChange={(e) => setEditWeightInput(e.target.value)}
                  />
                </label>

                {editMessage && (
                  <div className="ft-qa-message">{editMessage}</div>
                )}

                <div className="ft-modal-actions">
                  <button
                    type="button"
                    className="ft-btn"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="ft-btn ft-btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goal weight modal */}
        {isGoalModalOpen && (
          <div className="ft-modal-backdrop">
            <div className="ft-modal">
              <h2 className="ft-modal-title">Set goal weight</h2>

              <form onSubmit={handleSaveGoal} className="ft-modal-form">
                <label className="ft-qa-field">
                  <span>Goal weight (lbs)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                  />
                </label>

                {goalMessage && (
                  <div className="ft-qa-message">{goalMessage}</div>
                )}

                <div className="ft-modal-actions">
                  <button
                    type="button"
                    className="ft-btn"
                    onClick={() => setIsGoalModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="ft-btn ft-btn-primary">
                    Save goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
