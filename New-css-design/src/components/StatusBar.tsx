import "./StatusBar.css";
import { I } from "./Icons";

export default function StatusBar() {
  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <button className="statusbar__item statusbar__item--accent">
          <I.Branch size={12} />
          <span>main</span>
          <span className="statusbar__sub">↑ 2 ↓ 1</span>
        </button>
        <button className="statusbar__item">
          <I.Error size={12} className="status-err" />
          <span>2</span>
          <I.Warn size={12} className="status-warn" />
          <span>5</span>
        </button>
        <button className="statusbar__item">
          <span className="status-dot status-dot--ok" />
          <span>Lumen AI ready</span>
        </button>
      </div>

      <div className="statusbar__group">
        <button className="statusbar__item">Tauri 2.0</button>
        <button className="statusbar__item">Bun 1.1.34</button>
        <button className="statusbar__item">Ln 6, Col 24</button>
        <button className="statusbar__item">Spaces: 2</button>
        <button className="statusbar__item">UTF-8</button>
        <button className="statusbar__item">LF</button>
        <button className="statusbar__item statusbar__item--lang">
          TypeScript React
        </button>
        <button className="statusbar__item">
          <I.Bell size={12} />
        </button>
      </div>
    </footer>
  );
}
