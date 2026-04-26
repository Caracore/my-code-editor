import "./StatusBar.css";
import { I } from "./Icons";
import { useTabs } from "../context/TabsContext";
import { useSettingsContext } from "../context/SettingsContext";
import { detectLanguageFromFilename } from "../utils/detectLanguage";

export default function StatusBar() {
  const { tabs, activeTab } = useTabs();
  const { lspEnabled } = useSettingsContext();
  const file = tabs.find((t) => t.path === activeTab);
  const lang = file ? detectLanguageFromFilename(file.name) : "plain";

  const dirtyCount = tabs.filter((t) => t.isDirty).length;

  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <button className="statusbar__item statusbar__item--accent">
          <I.Branch size={12} />
          <span>main</span>
        </button>
        <button className="statusbar__item">
          <span
            className={`status-dot ${lspEnabled ? "status-dot--ok" : ""}`}
          />
          <span>{lspEnabled ? "LSP ready" : "LSP off"}</span>
        </button>
        {dirtyCount > 0 && (
          <button className="statusbar__item">
            <I.Warn size={12} className="status-warn" />
            <span>{dirtyCount} unsaved</span>
          </button>
        )}
      </div>

      <div className="statusbar__group">
        <button className="statusbar__item">Tauri 2.0</button>
        {file && (
          <button className="statusbar__item" title={file.path}>
            {file.name}
          </button>
        )}
        <button className="statusbar__item">UTF-8</button>
        <button className="statusbar__item">LF</button>
        <button className="statusbar__item statusbar__item--lang">
          {lang.toUpperCase()}
        </button>
        <button className="statusbar__item">
          <I.Bell size={12} />
        </button>
      </div>
    </footer>
  );
}
