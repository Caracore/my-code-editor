import "./EditorTabs.css";
import { I } from "./Icons";

const tabs = [
  { name: "App.tsx", ext: "tsx", active: true, dirty: true },
  { name: "Sidebar.tsx", ext: "tsx" },
  { name: "global.css", ext: "css" },
  { name: "package.json", ext: "json", dirty: true },
  { name: "README.md", ext: "md" },
];

const extColor: Record<string, string> = {
  tsx: "var(--cyan)",
  ts: "var(--accent)",
  css: "var(--magenta)",
  json: "var(--orange)",
  md: "var(--text-1)",
};

export default function EditorTabs() {
  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((t) => (
          <div
            key={t.name}
            className={`tab ${t.active ? "is-active" : ""}`}
          >
            <span
              className="tab__dot"
              style={{ background: extColor[t.ext] || "var(--text-2)" }}
            />
            <span className="tab__name">{t.name}</span>
            {t.dirty ? (
              <span className="tab__dirty" />
            ) : (
              <button className="tab__close" aria-label="Close">
                <I.Close size={11} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="tabs__actions">
        <button className="iconbtn" title="Split Editor">
          <I.Split size={14} />
        </button>
        <button className="iconbtn" title="More">
          <I.More size={14} />
        </button>
      </div>

      <div className="breadcrumbs">
        <span className="breadcrumbs__item">
          <I.Folder size={12} />
          src
        </span>
        <I.ChevronRight size={11} className="breadcrumbs__sep" />
        <span className="breadcrumbs__item">App.tsx</span>
        <I.ChevronRight size={11} className="breadcrumbs__sep" />
        <span className="breadcrumbs__item breadcrumbs__item--accent">
          App
        </span>
      </div>
    </div>
  );
}
