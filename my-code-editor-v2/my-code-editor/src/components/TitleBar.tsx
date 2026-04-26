import { I, Logo } from "./Icons";
import "./TitleBar.css";

const MENUS = ["File", "Edit", "View", "Navigate", "Code", "Refactor", "Run", "Tools", "Git", "Window", "Help"];

export default function TitleBar() {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar__left">
        <div className="titlebar__logo"><Logo size={18} /></div>
        <nav className="titlebar__menu">
          {MENUS.map((m) => (
            <button key={m} className="titlebar__menu-item">{m}</button>
          ))}
        </nav>
      </div>

      <div className="titlebar__center">
        <div className="titlebar__project">
          <span className="titlebar__project-name">my-code-editor</span>
          <span className="titlebar__sep">›</span>
          <span className="titlebar__project-file">src / components / EditorArea.tsx</span>
        </div>
      </div>

      <div className="titlebar__right">
        <div className="titlebar__runner">
          <select className="titlebar__config" defaultValue="dev">
            <option value="dev">▶ dev</option>
            <option value="build">build</option>
            <option value="tauri">tauri:dev</option>
          </select>
          <button className="titlebar__run" title="Run"><I.Play size={13} /></button>
          <button className="titlebar__run titlebar__run--debug" title="Debug"><I.Debug size={14} /></button>
          <button className="titlebar__run" title="Stop"><I.Stop size={12} /></button>
        </div>

        <div className="titlebar__divider" />

        <button className="titlebar__icon-btn" title="Search Everywhere (Ctrl+K)">
          <I.Search size={15} />
        </button>
        <button className="titlebar__icon-btn" title="Notifications"><I.Bell size={15} /></button>
        <button className="titlebar__icon-btn" title="Settings"><I.Settings size={15} /></button>
        <button className="titlebar__avatar" title="Account">JM</button>

        <div className="titlebar__divider" />

        <div className="titlebar__window">
          <button className="win-btn" title="Minimize"><I.Min size={12} /></button>
          <button className="win-btn" title="Maximize"><I.Max size={11} /></button>
          <button className="win-btn win-btn--close" title="Close"><I.Close size={12} /></button>
        </div>
      </div>
    </header>
  );
}

