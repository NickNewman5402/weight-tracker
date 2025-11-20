//import React from "react";

type Props = {
  name?: string;
  onLogout?: () => void;
};

export default function HeaderBar({ name, onLogout }: Props) {
  return (
    <header className="ft-header">
      <div>
        <h1 className="ft-title">FormaTrack</h1>
        <div className="ft-sub">{name ? `Welcome, ${name}` : " "}</div>
      </div>
      <button className="ft-btn" onClick={onLogout}>Log out</button>
    </header>
  );
}
