import "./TitleBar.css";
import { I } from "./Icons";

const menus = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"];

export default function TitleBar() {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar__left">
        <div className="titlebar__logo" aria-hidden>
          <span className="titlebar__logo-dot" />
        </div>
        <nav className="titlebar__menus">
          {menus.map((m) => (
            <button key={m} className="titlebar__menu">
              {m}
            </button>
          ))}
        </nav>
      </div>

      <div className="titlebar__center">
        <div className="titlebar__search">
          <I.Search size={13} />
          <span className="titlebar__search-text">
            my-code-editor-relooking
          </span>
          <kbd className="kbd">Ctrl K</kbd>
        </div>
      </div>

      <div className="titlebar__right">
        <button className="titlebar__btn titlebar__btn--accent" title="Run">
          <I.Play size={13} />
        </button>
        <button className="titlebar__btn" title="Stop">
          <I.Stop size={13} />
        </button>
        <span className="titlebar__sep" />
        <button className="titlebar__btn" title="Notifications">
          <I.Bell size={14} />
        </button>
        <button className="titlebar__btn" title="Settings">
          <I.Settings size={14} />
        </button>
        <span className="titlebar__sep" />
        <div className="titlebar__window">
          <button className="winbtn" title="Minimize">
            <I.Min size={12} />
          </button>
          <button className="winbtn" title="Maximize">
            <I.Max size={11} />
          </button>
          <button className="winbtn winbtn--close" title="Close">
            <I.Close size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}
