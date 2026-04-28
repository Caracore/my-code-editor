import { I } from "../Icons";
import "./ActivityBar.css";

const TOP = [
  { id: "files",  label: "Project (Ctrl+B)", icon: <I.Files /> },
  { id: "search", label: "Find",         icon: <I.Search /> },
  { id: "git",    label: "Git",          icon: <I.Git />, badge: 3 },
  { id: "debug",  label: "Run / Debug",  icon: <I.Debug /> },
  { id: "db",     label: "Database",     icon: <I.Database /> },
  { id: "ext",    label: "Plugins",      icon: <I.Extensions /> },
  { id: "ai",     label: "AI Assistant", icon: <I.Ai />, accent: true },
  { id: "todo",   label: "To-Do List",   icon: <I.CheckSquare /> },
];
const BOTTOM = [
  { id: "account", label: "Account",  icon: <I.Account /> },
  { id: "settings",label: "Settings", icon: <I.Settings /> },
];

export type SidebarView = "files" | "todo" | "db";

interface ActivityBarProps {
  sidebarOpen?: boolean;
  sidebarView?: SidebarView;
  onSelectSidebarView?: (view: SidebarView) => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onOpenExtensions?: () => void;
}

export default function ActivityBar({
  sidebarOpen = true,
  sidebarView = "files",
  onSelectSidebarView,
  onToggleSidebar,
  onOpenSettings,
  onOpenExtensions,
}: ActivityBarProps = {}) {
  const sidebarActiveId: string | null = sidebarOpen ? sidebarView : null;

  const handleClick = (id: string) => {
    // Sidebar-bound views: clicking the active one hides the sidebar; otherwise
    // switch to that view (and ensure the sidebar is open).
    if (id === "files" || id === "todo" || id === "db") {
      if (sidebarOpen && sidebarView === id) {
        onToggleSidebar?.();
      } else {
        onSelectSidebarView?.(id as SidebarView);
        if (!sidebarOpen) onToggleSidebar?.();
      }
      return;
    }
    if (id === "ai") {
      window.dispatchEvent(new CustomEvent("menu-action", { detail: "view:toggle-right" }));
      return;
    }
    if (id === "settings") {
      onOpenSettings?.();
      return;
    }
    if (id === "ext") {
      onOpenExtensions?.();
      return;
    }
    // search/git/debug: no-op for now.
  };

  return (
    <aside className="activitybar">
      <div className="activitybar__group">
        {TOP.map((item) => {
          const isActive = sidebarActiveId === item.id;
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
          <button
            key={item.id}
            className="activitybar__btn"
            title={item.id === "settings" ? "Settings (Ctrl+,)" : item.label}
            onClick={() => handleClick(item.id)}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </aside>
  );
}


