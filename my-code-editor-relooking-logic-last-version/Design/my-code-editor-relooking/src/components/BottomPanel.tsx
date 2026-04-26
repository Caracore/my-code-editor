import "./BottomPanel.css";
import { I } from "./Icons";

const tabs = ["Problems", "Output", "Debug Console", "Terminal", "Ports"];

export default function BottomPanel() {
  return (
    <section className="panel">
      <div className="panel__header">
        <div className="panel__tabs">
          {tabs.map((t, i) => (
            <button
              key={t}
              className={`panel__tab ${i === 3 ? "is-active" : ""}`}
            >
              {t}
              {i === 0 && <span className="panel__count panel__count--err">2</span>}
              {i === 0 && <span className="panel__count panel__count--warn">5</span>}
            </button>
          ))}
        </div>

        <div className="panel__actions">
          <div className="panel__select">
            <span className="panel__select-dot" />
            <span>bash — my-code-editor-relooking</span>
            <I.ChevronDown size={12} />
          </div>
          <button className="iconbtn" title="New Terminal">
            <I.Plus size={14} />
          </button>
          <button className="iconbtn" title="Split Terminal">
            <I.Split size={14} />
          </button>
          <button className="iconbtn" title="Kill">
            <I.Trash size={14} />
          </button>
          <span className="titlebar__sep" />
          <button className="iconbtn" title="Maximize">
            <I.Max size={12} />
          </button>
          <button className="iconbtn" title="Close">
            <I.Close size={14} />
          </button>
        </div>
      </div>

      <div className="terminal">
        <div className="terminal__line">
          <span className="terminal__prompt">
            <span className="terminal__user">jm</span>
            <span className="terminal__at">@</span>
            <span className="terminal__host">lumen</span>
            <span className="terminal__sep">:</span>
            <span className="terminal__path">~/projects/my-code-editor</span>
            <span className="terminal__branch">
              <I.Branch size={11} /> main
            </span>
            <span className="terminal__caret">❯</span>
          </span>
          <span className="terminal__cmd">bun install</span>
        </div>
        <div className="terminal__out">
          <span className="ok">✓</span> Resolved, downloaded and extracted{" "}
          <b>284</b> packages in 1.2s
        </div>
        <div className="terminal__line">
          <span className="terminal__prompt">
            <span className="terminal__user">jm</span>
            <span className="terminal__at">@</span>
            <span className="terminal__host">lumen</span>
            <span className="terminal__sep">:</span>
            <span className="terminal__path">~/projects/my-code-editor</span>
            <span className="terminal__branch">
              <I.Branch size={11} /> main
            </span>
            <span className="terminal__caret">❯</span>
          </span>
          <span className="terminal__cmd">bun run tauri dev</span>
        </div>
        <div className="terminal__out">
          <span className="dim">VITE v5.4.0</span>{" "}
          <span className="ok">ready in 312 ms</span>
        </div>
        <div className="terminal__out">
          ➜&nbsp; Local:&nbsp;&nbsp; <a className="link">http://localhost:1420/</a>
        </div>
        <div className="terminal__out">
          ➜&nbsp; Network: use <span className="dim">--host</span> to expose
        </div>
        <div className="terminal__line">
          <span className="terminal__prompt">
            <span className="terminal__user">jm</span>
            <span className="terminal__at">@</span>
            <span className="terminal__host">lumen</span>
            <span className="terminal__sep">:</span>
            <span className="terminal__path">~/projects/my-code-editor</span>
            <span className="terminal__branch">
              <I.Branch size={11} /> main
            </span>
            <span className="terminal__caret">❯</span>
          </span>
          <span className="terminal__cursor" />
        </div>
      </div>
    </section>
  );
}
