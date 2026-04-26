import "./TitleBar.css";
import { I } from "./Icons";
import { useWorkspace } from "../context/WorkspaceContext";
import { getCurrentWindow } from "@tauri-apps/api/window";

const menus = [
  "File",
  "Edit",
  "Selection",
  "View",
  "Go",
  "Run",
  "Terminal",
  "Help",
];

export default function TitleBar() {
  const {
    setCommandPaletteOpen,
    setSettingsPanelOpen,
    setRightPanelVisible,
    rightPanelVisible,
    rootPath,
    handleOpenFolder,
  } = useWorkspace();

  const projectName = rootPath
    ? rootPath.split(/[\\/]/).pop()
    : "no-folder-open";

  const onMenuClick = (label: string) => {
    if (label === "File") handleOpenFolder();
  };

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar__left">
        <div className="titlebar__logo" aria-hidden>
          <span className="titlebar__logo-dot" />
        </div>
        <nav className="titlebar__menus">
          {menus.map((m) => (
            <button
              key={m}
              className="titlebar__menu"
              onClick={() => onMenuClick(m)}
            >
              {m}
            </button>
          ))}
        </nav>
      </div>

      <div className="titlebar__center">
        <button
          className="titlebar__search"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <I.Search size={13} />
          <span className="titlebar__search-text">{projectName}</span>
          <kbd className="kbd">Ctrl K</kbd>
        </button>
      </div>

      <div className="titlebar__right">
        <button className="titlebar__btn titlebar__btn--accent" title="Run">
          <I.Play size={13} />
        </button>
        <button className="titlebar__btn" title="Stop">
          <I.Stop size={13} />
        </button>
        <span className="titlebar__sep" />
        <button
          className={`titlebar__btn ${rightPanelVisible ? "is-active" : ""}`}
          title="Toggle AI Panel"
          onClick={() => setRightPanelVisible(!rightPanelVisible)}
        >
          <I.Sparkle size={14} />
        </button>
        <button className="titlebar__btn" title="Notifications">
          <I.Bell size={14} />
        </button>
        <button
          className="titlebar__btn"
          title="Settings"
          onClick={() => setSettingsPanelOpen(true)}
        >
          <I.Settings size={14} />
        </button>
        <span className="titlebar__sep" />
        <div className="titlebar__window">
          <button
            className="winbtn"
            title="Minimize"
            onClick={() => getCurrentWindow().minimize().catch(() => {})}
          >
            <I.Min size={12} />
          </button>
          <button
            className="winbtn"
            title="Maximize"
            onClick={() => getCurrentWindow().toggleMaximize().catch(() => {})}
          >
            <I.Max size={11} />
          </button>
          <button
            className="winbtn winbtn--close"
            title="Close"
            onClick={() => getCurrentWindow().close().catch(() => {})}
          >
            <I.Close size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}
