import "./ActivityBar.css";
import { I } from "./Icons";

const items = [
  { id: "files", icon: I.Files, label: "Explorer", active: true, badge: undefined },
  { id: "search", icon: I.Search, label: "Search" },
  { id: "git", icon: I.Git, label: "Source Control", badge: 3 },
  { id: "debug", icon: I.Debug, label: "Run & Debug" },
  { id: "ext", icon: I.Extensions, label: "Extensions", badge: 12 },
  { id: "ai", icon: I.Sparkle, label: "AI Assistant" },
] as const;

export default function ActivityBar() {
  return (
    <aside className="activitybar">
      <div className="activitybar__group">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              className={`activitybar__item ${
                "active" in it && it.active ? "is-active" : ""
              }`}
              title={it.label}
            >
              <Icon size={20} />
              {"badge" in it && it.badge ? (
                <span className="activitybar__badge">{it.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="activitybar__group">
        <button className="activitybar__item" title="Account">
          <I.Account size={20} />
        </button>
        <button className="activitybar__item" title="Settings">
          <I.Settings size={20} />
        </button>
      </div>
    </aside>
  );
}
