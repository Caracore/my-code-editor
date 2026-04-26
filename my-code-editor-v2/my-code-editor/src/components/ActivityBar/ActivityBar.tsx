import { useState } from "react";
import { I } from "../Icons";
import "./ActivityBar.css";

const TOP = [
  { id: "files",  label: "Project (Ctrl+B)", icon: <I.Files /> },
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

interface ActivityBarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function ActivityBar({
  sidebarOpen = true,
  onToggleSidebar,
}: ActivityBarProps = {}) {
  const [active, setActive] = useState("files");

  const handleClick = (id: string) => {
    if (id === "files") {
      // Clicking the active "Project" button hides the sidebar; clicking it
      // again (when hidden) re-opens it. Other buttons just become active.
      onToggleSidebar?.();
      setActive(id);
      return;
    }
    if (id === "ai") {
      window.dispatchEvent(new CustomEvent("menu-action", { detail: "view:toggle-right" }));
      setActive(id);
      return;
    }
    setActive(id);
  };

  return (
    <aside className="activitybar">
      <div className="activitybar__group">
        {TOP.map((item) => {
          const isActive =
            item.id === "files"
              ? active === item.id && sidebarOpen
              : active === item.id;
          return (
            <button
              key={item.id}
              className={`activitybar__btn ${isActive ? "is-active" : ""} ${item.accent ? "is-accent" : ""}`}
              title={item.label}
              onClick={() => handleClick(item.id)}
            >
              {item.icon}
              {item.badge ? <span className="activitybar__badge">{item.badge}</span> : null}
            </button>
          );
        })}
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


