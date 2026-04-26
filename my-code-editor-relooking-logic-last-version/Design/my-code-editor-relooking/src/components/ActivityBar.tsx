import "./ActivityBar.css";
import { I } from "./Icons";
import {
  useWorkspace,
  type ActivityView,
} from "../context/WorkspaceContext";

const items: {
  id: ActivityView;
  icon: keyof typeof I;
  label: string;
}[] = [
  { id: "files", icon: "Files", label: "Explorer" },
  { id: "search", icon: "Search", label: "Search" },
  { id: "git", icon: "Git", label: "Source Control" },
  { id: "debug", icon: "Debug", label: "Run & Debug" },
  { id: "ext", icon: "Extensions", label: "Extensions" },
  { id: "ai", icon: "Sparkle", label: "AI Assistant" },
];

export default function ActivityBar() {
  const {
    activityView,
    setActivityView,
    sidebarVisible,
    setSidebarVisible,
    setSettingsPanelOpen,
    setRightPanelVisible,
    rightPanelVisible,
  } = useWorkspace();

  const onClick = (id: ActivityView) => {
    if (id === "ai") {
      setRightPanelVisible(!rightPanelVisible);
      return;
    }
    if (activityView === id && sidebarVisible) {
      setSidebarVisible(false);
    } else {
      setActivityView(id);
      setSidebarVisible(true);
    }
  };

  return (
    <aside className="activitybar">
      <div className="activitybar__group">
        {items.map((it) => {
          const Icon = I[it.icon];
          const active = activityView === it.id && sidebarVisible;
          return (
            <button
              key={it.id}
              className={`activitybar__item ${active ? "is-active" : ""}`}
              title={it.label}
              onClick={() => onClick(it.id)}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div className="activitybar__group">
        <button className="activitybar__item" title="Account">
          <I.Account size={20} />
        </button>
        <button
          className="activitybar__item"
          title="Settings"
          onClick={() => setSettingsPanelOpen(true)}
        >
          <I.Settings size={20} />
        </button>
      </div>
    </aside>
  );
}
