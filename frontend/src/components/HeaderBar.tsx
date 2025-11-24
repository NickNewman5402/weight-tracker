//import React from "react";

type Props = {
  name?: string;
  onLogout?: () => void;
  onEditGoal?: () => void;
};

export default function HeaderBar({ name, onLogout, onEditGoal }: Props) {
  return (
    <header className="ft-header">
      <div>
        <h1 className="ft-title">FormaTrack</h1>
        <div
          className="ft-sub"
          style={{ fontSize: "1.4rem", fontWeight: 500 }}
          >
          {name ? `Welcome, ${name}` : "Welcome"}
        </div>

      </div>

      {/* Right-side buttons */}
      <div className="ft-header-actions">
        {onEditGoal && (
          <button className="ft-btn" type="button" onClick={onEditGoal}>
            Set goal
          </button>
        )}

        <button className="ft-btn" type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

