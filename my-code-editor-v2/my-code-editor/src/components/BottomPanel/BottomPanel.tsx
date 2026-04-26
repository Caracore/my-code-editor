import { useState } from "react";
import { I } from "../Icons";
import "./BottomPanel.css";

const TABS = [
  { id: "terminal", label: "Terminal", icon: <I.Terminal size={13} /> },
  { id: "problems", label: "Problems", icon: <I.Error size={13} />, badge: 2 },
  { id: "output",   label: "Output",   icon: <I.More size={13} /> },
  { id: "debug",    label: "Debug",    icon: <I.Debug size={13} /> },
  { id: "git",      label: "Git",      icon: <I.Git size={13} /> },
];

export default function BottomPanel() {
  const [tab, setTab] = useState("terminal");
  return (
    <section className="bottompanel">
      <div className="bottompanel__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`bp-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.badge && <span className="bp-tab__badge">{t.badge}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="bp-iconbtn" title="New terminal"><I.Plus size={13} /></button>
        <button className="bp-iconbtn" title="Split"><I.Split size={13} /></button>
        <button className="bp-iconbtn" title="Trash"><I.Trash size={13} /></button>
        <button className="bp-iconbtn" title="Close"><I.Close size={13} /></button>
      </div>

      {tab === "terminal" && (
        <div className="terminal">
          <div className="terminal__line"><span className="t-prompt">jm</span><span className="t-at">@</span><span className="t-host">workstation</span><span className="t-path"> ~/projects/my-code-editor </span><span className="t-branch">  main </span><span className="t-cmd">$ pnpm tauri dev</span></div>
          <div className="terminal__line t-out">  <span className="t-info">vite</span> v6.0.5 ready in <span className="t-num">412</span> ms</div>
          <div className="terminal__line t-out">  ➜  Local:   <span className="t-link">http://localhost:1420/</span></div>
          <div className="terminal__line t-out">  ➜  Network: use --host to expose</div>
          <div className="terminal__line t-out">    <span className="t-success">✔</span> Compiled <span className="t-mono">my_code_editor_lib</span> in <span className="t-num">3.84s</span></div>
          <div className="terminal__line t-out">    <span className="t-success">✔</span> Compiled <span className="t-mono">my-code-editor</span> in <span className="t-num">1.21s</span></div>
          <div className="terminal__line t-out">    <span className="t-warn">!</span> 1 warning: unused import <span className="t-mono">useEffect</span></div>
          <div className="terminal__line t-out">    Running app on <span className="t-link">tauri://localhost</span> …</div>
          <div className="terminal__line"><span className="t-prompt">jm</span><span className="t-at">@</span><span className="t-host">workstation</span><span className="t-path"> ~/projects/my-code-editor </span><span className="t-branch">  main </span><span className="t-cmd">$ </span><span className="t-caret" /></div>
        </div>
      )}

      {tab === "problems" && (
        <div className="problems">
          <div className="problem-row problem-row--err">
            <I.Error size={13} />
            <span className="problem-row__file">EditorArea.tsx</span>
            <span className="problem-row__line">17:24</span>
            <span className="problem-row__msg">Property 'minimap' does not exist on type 'Document'.</span>
            <span className="problem-row__src">ts(2339)</span>
          </div>
          <div className="problem-row problem-row--warn">
            <I.Warn size={13} />
            <span className="problem-row__file">App.tsx</span>
            <span className="problem-row__line">3:10</span>
            <span className="problem-row__msg">'useEffect' is declared but its value is never read.</span>
            <span className="problem-row__src">ts(6133)</span>
          </div>
        </div>
      )}

      {tab !== "terminal" && tab !== "problems" && (
        <div className="bp-empty">No content for "{tab}" yet.</div>
      )}
    </section>
  );
}

