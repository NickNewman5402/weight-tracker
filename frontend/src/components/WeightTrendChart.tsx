import React, { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Types
type WeighIn = {
  _id?: string;
  date: string;
  weight: number | string;
  note?: string;
};

interface WeightTrendChartProps {
  weighIns: WeighIn[];
}

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ weighIns = [] }) => {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all" | "custom">("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const normalizeDate = (d: string | Date): Date => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const formatLabelDate = (d: string | Date): string => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);



const filteredData = useMemo(() => 
{
    if (!weighIns || weighIns.length === 0) return [];

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (range === "7d") {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "30d") {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === "90d") {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
    } else if (range === "custom" && customStart && customEnd) {
      startDate = normalizeDate(customStart);
      endDate = normalizeDate(customEnd);
    }

    const sorted = [...weighIns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // First, try applying the date filter
    let result = sorted
      .filter((w) => 
                {
                  const d = normalizeDate(w.date);
                  if (startDate && d < startDate) return false;
                  if (endDate && d > endDate) return false;
                  return true;
                }
              )
      
      .map((w) => 
      ({
        ...w,
        xLabel: formatLabelDate(w.date),
        weight: Number(w.weight),
      }));

    // If the filter produced nothing but we *do* have data,
    // fall back to "just show everything"
    if (result.length === 0 && weighIns.length > 0) {
      result = sorted.map((w) => ({
        ...w,
        xLabel: formatLabelDate(w.date),
        weight: Number(w.weight),
      }));
    }

    return result;
  }, [weighIns, range, customStart, customEnd, today]);


  const hasCustomRange = range === "custom";

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Weight Trend</h2>

        <div style={styles.rangeControls}>
          <button style={range === "7d" ? styles.rangeButtonActive : styles.rangeButton} onClick={() => setRange("7d")}>7d</button>
          <button style={range === "30d" ? styles.rangeButtonActive : styles.rangeButton} onClick={() => setRange("30d")}>30d</button>
          <button style={range === "90d" ? styles.rangeButtonActive : styles.rangeButton} onClick={() => setRange("90d")}>90d</button>
          <button style={range === "all" ? styles.rangeButtonActive : styles.rangeButton} onClick={() => setRange("all")}>All</button>
          <button style={range === "custom" ? styles.rangeButtonActive : styles.rangeButton} onClick={() => setRange("custom")}>Custom</button>
        </div>
      </div>

      {hasCustomRange && (
        <div style={styles.customRangeRow}>
          <label style={styles.customLabel}>
            From:
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={styles.dateInput} />
          </label>
          <label style={styles.customLabel}>
            To:
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={styles.dateInput} />
          </label>
        </div>
      )}

      {filteredData.length === 0 ? (
        <p style={styles.emptyText}>Not enough data in this range yet. Add a few weigh-ins to see the trend.</p>
      ) : (
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={filteredData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="xLabel" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  card: {
    background: "rgba(0, 0, 0, 0.35)",         // soft translucent background like other panels
    borderRadius: "14px",
    padding: "16px 20px",
    border: "1px solid rgba(245, 201, 111, 0.28)", // goldish border (light)
    boxShadow: "0 8px 20px rgba(0,0,0,0.6)",       // deep drop shadow like your panels
    backdropFilter: "blur(4px)",                   // gives that frosted/softened glass look
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#f7d98c", // FormaTrack gold title
  },

  rangeControls: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  rangeButton: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    cursor: "pointer",
    border: "1px solid rgba(245, 201, 111, 0.25)",
    background: "rgba(0,0,0,0.3)",
    color: "#f5d98a",
    transition: "all 0.2s ease",
  },

  rangeButtonActive: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.7)",
    background: "linear-gradient(135deg, #f8e39a, #f0c66a)",
    color: "#1a1207",
    boxShadow: "0 0 6px rgba(248,219,130,0.7)",
    transition: "all 0.2s ease",
  },

  customRangeRow: {
    display: "flex",
    gap: "12px",
    margin: "10px 0 6px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  customLabel: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.8rem",
    gap: "3px",
    color: "#e7d4a0",
  },

  dateInput: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid rgba(245,201,111,0.35)",
    background: "rgba(0, 0, 0, 0.55)",
    color: "#f8e7b3",
    fontSize: "0.8rem",
  },

  chartWrapper: {
    width: "100%",
    height: "260px",
    marginTop: "6px",
  },

  emptyText: {
    color: "#bda673",
    fontSize: "0.85rem",
    marginTop: "4px",
  },
};



export default WeightTrendChart;
