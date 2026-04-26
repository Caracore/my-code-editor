import { useState } from "react";
import { I } from "../Icons";
import "./ActivityBar.css";

const TOP = [
  { id: "files",  label: "Project",     icon: <I.Files /> },
  { id: "search", label: "Find",        icon: <I.Search /> },
  { id: "git",    label: "Git",         icon: <I.Git />, badge: 3 },
  { id: "debug",  label: "Run / Debug", icon: <I.Debug /> },
  { id: "db",     label: "Database",    icon: <I.Database /> },
  { id: "ext",    label: "Plugins",     icon: <I.Extensions /> },
  { id: "ai",     label: "AI Assistant",icon: <I.Ai />, accent: true },
];
const BOTTOM = [
  { id: "account", label: "Account",  icon: <I.Account /> },
  { id: "settings",label: "Settings", icon: <I.Settings /> },
];

export default function ActivityBar() {
  const [active, setActive] = useState("files");
  return (
    <aside className="activitybar">
      <div className="activitybar__group">
        {TOP.map((item) => (
          <button
            key={item.id}
            className={`activitybar__btn ${active === item.id ? "is-active" : ""} ${item.accent ? "is-accent" : ""}`}
            title={item.label}
            onClick={() => setActive(item.id)}
          >
            {item.icon}
            {item.badge ? <span className="activitybar__badge">{item.badge}</span> : null}
          </button>
        ))}
      </div>
      <div className="activitybar__group">
        {BOTTOM.map((item) => (
          <button key={item.id} className="activitybar__btn" title={item.label}>
            {item.icon}
          </button>
        ))}
      </div>
    </aside>
  );
}

