import { I } from "../Icons";
import "./StatusBar.css";

interface StatusBarProps {
  terminalOpen?: boolean;
  rightOpen?: boolean;
  onToggleTerminal?: () => void;
  onToggleRight?: () => void;
}

export default function StatusBar({
  terminalOpen = true,
  rightOpen = true,
  onToggleTerminal,
  onToggleRight,
}: StatusBarProps = {}) {
  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <button className="sb-item" title="Git branch">
          <I.Branch size={12} /> <span>main</span>
          <span className="sb-mut">↑1 ↓0</span>
        </button>
        <button className="sb-item sb-item--warn" title="Problems">
          <I.Warn size={12} /> 1
        </button>
        <button className="sb-item sb-item--err" title="Errors">
          <I.Error size={12} /> 2
        </button>
        <button className="sb-item">
          <I.Sparkle size={12} /> AI ready
        </button>
      </div>

      <div className="statusbar__center">
        <span className="sb-task">
          <span className="sb-task__spinner" />
          Indexing workspace · 84%
        </span>
      </div>

      <div className="statusbar__group">
        <button className="sb-item">Ln 7, Col 24</button>
        <button className="sb-item">Spaces: 2</button>
        <button className="sb-item">UTF-8</button>
        <button className="sb-item">LF</button>
        <button className="sb-item">TypeScript JSX</button>
        <button
          className={`sb-item ${terminalOpen ? "is-active" : ""}`}
          title="Toggle Terminal (Ctrl+J)"
          onClick={onToggleTerminal}
        >
          <I.Terminal size={12} />
        </button>
        <button
          className={`sb-item ${rightOpen ? "is-active" : ""}`}
          title="Toggle AI panel (Ctrl+Alt+B)"
          onClick={onToggleRight}
        >
          <I.Ai size={12} />
        </button>
        <button className="sb-item" title="Network"><I.Wifi size={12} /></button>
        <button className="sb-item" title="Notifications"><I.Bell size={12} /></button>
      </div>
    </footer>
  );
}


