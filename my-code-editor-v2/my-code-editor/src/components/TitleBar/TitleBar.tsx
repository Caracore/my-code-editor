import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { I, Logo } from "../Icons";
import MenuDropdown from "../MenuDropDown/MenuDropDown";
import { TOP_MENUS } from "../../config/menuConfig";
import "./TitleBar.css";

export default function TitleBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Track window maximized state for the icon
  useEffect(() => {
    const win = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    win.isMaximized().then(setIsMaximized).catch(() => {});
    win.onResized(() => {
      win.isMaximized().then(setIsMaximized).catch(() => {});
    }).then((u) => { unlisten = u; }).catch(() => {});
    return () => { unlisten?.(); };
  }, []);

  // Close menu on outside click / Escape
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  // Window controls
  const handleMinimize = async () => {
    try { await getCurrentWindow().minimize(); } catch (e) { console.error(e); }
  };
  const handleToggleMaximize = async () => {
    try { await getCurrentWindow().toggleMaximize(); } catch (e) { console.error(e); }
  };
  const handleClose = async () => {
    try { await getCurrentWindow().close(); } catch (e) { console.error(e); }
  };

  // Handle menu actions that target the window/app directly
  const handleMenuAction = (action: string) => {
    switch (action) {
      case "window:minimize":        handleMinimize(); break;
      case "window:toggle-maximize": handleToggleMaximize(); break;
      case "window:close":
      case "app:exit":               handleClose(); break;
      case "window:reload":          window.location.reload(); break;
      case "view:fullscreen":        getCurrentWindow().setFullscreen(true).catch(() => {}); break;
    }
  };

  const onMenuClick = (label: string) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  };
  const onMenuEnter = (label: string) => {
    // Switch active dropdown when a menu is already open (hover-nav)
    if (openMenu && openMenu !== label) setOpenMenu(label);
  };

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar__left">
        <div className="titlebar__logo"><Logo size={18} /></div>
        <nav className="titlebar__menu" ref={navRef}>
          {TOP_MENUS.map((m) => (
            <div key={m.label} className="titlebar__menu-wrap">
              <button
                className={`titlebar__menu-item${openMenu === m.label ? " is-active" : ""}`}
                onClick={() => onMenuClick(m.label)}
                onMouseEnter={() => onMenuEnter(m.label)}
              >
                {m.label}
              </button>
              {openMenu === m.label && (
                <MenuDropdown
                  items={m.items}
                  onAction={handleMenuAction}
                  onClose={() => setOpenMenu(null)}
                />
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="titlebar__center">
        <div className="titlebar__project">
          {/* <span className="titlebar__project-name">my-code-editor</span> */}
          <span className="titlebar__project-name">My Code Editor</span>
          <span className="titlebar__sep">›</span>
          <span className="titlebar__project-file">src / components / EditorArea.tsx</span>
        </div>
      </div>

      <div className="titlebar__right">
        <div className="titlebar__runner">
          <select className="titlebar__config" defaultValue="dev">
            {/* Changer la configuration ici dev ou new debugger */}
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
          <button className="win-btn" title="Minimize" onClick={handleMinimize}>
            <I.Min size={12} />
          </button>
          <button
            className="win-btn"
            title={isMaximized ? "Restore" : "Maximize"}
            onClick={handleToggleMaximize}
          >
            <I.Max size={11} />
          </button>
          <button className="win-btn win-btn--close" title="Close" onClick={handleClose}>
            <I.Close size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}
