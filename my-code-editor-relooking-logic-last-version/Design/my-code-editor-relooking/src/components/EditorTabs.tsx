import "./EditorTabs.css";
import { I } from "./Icons";
import { useTabs } from "../context/TabsContext";

const extColor: Record<string, string> = {
  tsx: "var(--cyan)",
  ts: "var(--accent)",
  jsx: "var(--cyan)",
  js: "var(--warning)",
  css: "var(--magenta)",
  json: "var(--orange)",
  md: "var(--text-1)",
  html: "var(--orange)",
  rs: "var(--orange)",
  py: "var(--green)",
};

function extOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export default function EditorTabs() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();

  const active = tabs.find((t) => t.path === activeTab);
  const breadcrumb = active
    ? active.path.split(/[\\/]/).filter(Boolean)
    : [];

  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((t) => {
          const ext = extOf(t.name);
          const isActive = activeTab === t.path;
          return (
            <div
              key={t.path}
              className={`tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(t.path)}
              title={t.path}
            >
              <span
                className="tab__dot"
                style={{ background: extColor[ext] || "var(--text-2)" }}
              />
              <span className="tab__name">{t.name}</span>
              {t.isDirty ? (
                <span className="tab__dirty" />
              ) : (
                <button
                  className="tab__close"
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.path);
                  }}
                >
                  <I.Close size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="tabs__actions">
        <button className="iconbtn" title="Split Editor">
          <I.Split size={14} />
        </button>
        <button className="iconbtn" title="More">
          <I.More size={14} />
        </button>
      </div>

      {breadcrumb.length > 0 && (
        <div className="breadcrumbs">
          {breadcrumb.slice(-4).map((part, i, arr) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span
                className={`breadcrumbs__item ${
                  i === arr.length - 1 ? "breadcrumbs__item--accent" : ""
                }`}
              >
                {i === 0 && i !== arr.length - 1 && (
                  <I.Folder size={12} />
                )}
                {part}
              </span>
              {i < arr.length - 1 && (
                <I.ChevronRight size={11} className="breadcrumbs__sep" />
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
