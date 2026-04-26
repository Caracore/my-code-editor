import { useState } from "react";
import { I } from "../Icons";
import "./EditorTabs.css";

type Tab = { id: string; name: string; ext: string; dirty?: boolean; pinned?: boolean };

const INIT: Tab[] = [
  { id: "1", name: "App.tsx",         ext: "tsx", pinned: true },
  { id: "2", name: "Sidebar.tsx",     ext: "tsx" },
  { id: "3", name: "EditorArea.tsx",  ext: "tsx", dirty: true },
  { id: "4", name: "theme.css",       ext: "css" },
  { id: "5", name: "package.json",    ext: "json" },
];

const COLOR: Record<string, string> = {
  tsx: "#1a73c4", ts: "#3178c6", css: "#264de4",
  json: "#8a8a8a", md: "#444", toml: "#d34516",
};

export default function EditorTabs() {
  const [tabs, setTabs] = useState(INIT);
  const [active, setActive] = useState("3");

  const close = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((t) => t.filter((x) => x.id !== id));
  };

  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`tab ${active === t.id ? "is-active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            <span className="tab__color" style={{ background: COLOR[t.ext] ?? "#666" }} />
            <span className="tab__name">{t.name}</span>
            {t.dirty && <span className="tab__dirty" title="Unsaved" />}
            <button className="tab__close" onClick={close(t.id)}>
              <I.Close size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="tabs__actions">
        <button className="tabs__action" title="Split right"><I.Split size={14} /></button>
        <button className="tabs__action" title="More"><I.More size={14} /></button>
      </div>
    </div>
  );
}

