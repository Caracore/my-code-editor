import { I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import "./EditorTabs.css";

const COLOR: Record<string, string> = {
  tsx: "#1a73c4", ts: "#3178c6", css: "#264de4",
  json: "#8a8a8a", md: "#444", toml: "#d34516",
  js: "#f7df1e", jsx: "#1a73c4", html: "#e34f26",
  py: "#3776ab", rs: "#d34516", cpp: "#00599c",
};

export default function EditorTabs() {
  const { tabs, activeId, setActive, closeTab, togglePinned } = useWorkspace();

  const onClose = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(id);
  };

  // Middle-click closes the tab
  const onAuxClick = (id: string) => (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(id);
    }
  };

  // Double-click toggles pinned state
  const onDoubleClick = (id: string) => () => togglePinned(id);

  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`tab ${activeId === t.id ? "is-active" : ""} ${t.pinned ? "is-pinned" : ""}`}
            onClick={() => setActive(t.id)}
            onAuxClick={onAuxClick(t.id)}
            onDoubleClick={onDoubleClick(t.id)}
            title={t.path}
          >
            <span className="tab__color" style={{ background: COLOR[t.ext] ?? "#666" }} />
            <span className="tab__name">{t.name}</span>
            {t.pinned && <span className="tab__pin" title="Pinned">📌</span>}
            {t.dirty
              ? <span className="tab__dirty" title="Unsaved changes" />
              : null}
            <button
              className="tab__close"
              onClick={onClose(t.id)}
              title="Close (Ctrl+W)"
            >
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
