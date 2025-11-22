import { useEffect, useState } from "react";

type WeighInEntry = {
  _id: string;
  date: string;
  weight: number;
  note?: string;
};

function formatISODate(dateString: string) {
  if (!dateString) return "";

  // Take just "YYYY-MM-DD" from "YYYY-MM-DDTHH:MM:SSZ"
  const isoPart = dateString.slice(0, 10); // "2025-11-20"
  const [year, month, day] = isoPart.split("-");

  // Display as MM/DD/YYYY
  return `${month}/${day}/${year}`;
}

type RecentEntriesProps = {
  // whenever this number changes, we refetch
  refreshKey: number;
};

export default function RecentEntries({ refreshKey }: RecentEntriesProps) {
  const [entries, setEntries] = useState<WeighInEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const jwtToken = localStorage.getItem("jwtToken");
        if (!jwtToken) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const resp = await fetch("/api/weights/recent?limit=10", {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        const data = await resp.json();

        if (!resp.ok) {
          setError(data.error || "Failed to load entries.");
          setLoading(false);
          return;
        }

        setEntries(data.entries);
      } catch (err) {
        console.error(err);
        setError("Network error loading entries.");
      }

      setLoading(false);
    }

    load();
  }, [refreshKey]); // 👈 refetch when refreshKey changes

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this weigh-in?")) return;

    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        setError("You are not logged in.");
        return;
      }

      const resp = await fetch(`/api/weights/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        setError(data.error || "Failed to delete weigh-in.");
        return;
      }

      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error(err);
      setError("Network error deleting weigh-in.");
    }
  }

  async function handleEdit(entry: WeighInEntry) {
    const newWeightStr = window.prompt(
      "Update weight (lbs):",
      entry.weight.toString()
    );
    if (newWeightStr === null) return; // cancel

    const newWeight = parseFloat(newWeightStr);
    if (Number.isNaN(newWeight)) {
      alert("Please enter a valid number.");
      return;
    }

    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        setError("You are not logged in.");
        return;
      }

      const resp = await fetch(`/api/weights/${entry._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ weight: newWeight }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Failed to update weigh-in.");
        return;
      }

      const updated = data.weighIn as WeighInEntry;

      setEntries((prev) =>
        prev.map((e) => (e._id === entry._id ? updated : e))
      );
    } catch (err) {
      console.error(err);
      setError("Network error updating weigh-in.");
    }
  }

  if (loading) return <div className="ft-panel-placeholder">Loading…</div>;
  if (error) return <div className="ft-panel-placeholder">{error}</div>;

  if (entries.length === 0)
    return <div className="ft-panel-placeholder">No recent entries yet.</div>;

  return (
    <div className="ft-recent-table">
      <div className="ft-recent-header">
        <span>Date</span>
        <span>Weight</span>
        <span className="ft-recent-actions-header"></span>
      </div>

      {entries.map((e) => {
        const d = formatISODate(e.date);

        return (
          <div className="ft-recent-row" key={e._id}>
            <span>{d}</span>
            <span>{e.weight} lbs</span>
            <span className="ft-recent-actions">
              <button
                type="button"
                className="ft-link-button"
                onClick={() => handleEdit(e)}
              >
                Edit
              </button>
              <button
                type="button"
                className="ft-link-button ft-link-button--danger"
                onClick={() => handleDelete(e._id)}
              >
                Delete
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
