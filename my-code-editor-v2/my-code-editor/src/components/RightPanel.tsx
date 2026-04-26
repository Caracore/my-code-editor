import { useState } from "react";
import { I } from "./Icons";
import "./RightPanel.css";

type Msg = { from: "ai" | "me"; text: string; code?: string };

const HISTORY: Msg[] = [
  {
    from: "ai",
    text: "Hi 👋 I scanned your project. Want me to refactor `EditorArea` into smaller components, or generate tests?",
  },
  { from: "me", text: "Refactor it and add a Toolbar component please." },
  {
    from: "ai",
    text: "Done. I extracted `<Toolbar />` and lifted state. Here is the diff preview:",
    code:
`+ export function Toolbar({ doc }: { doc: Document }) {
+   return <header className="toolbar">…</header>;
+ }`,
  },
];

const SUGGESTIONS = [
  "Explain selected code",
  "Generate unit tests",
  "Find bugs in this file",
  "Optimize performance",
];

export default function RightPanel() {
  const [tab, setTab] = useState<"chat" | "edit" | "agents">("chat");
  return (
    <aside className="rightpanel">
      <div className="rightpanel__tabs">
        <button className={`rp-tab ${tab === "chat" ? "is-active" : ""}`} onClick={() => setTab("chat")}>
          <I.Sparkle size={13} /> AI Chat
        </button>
        <button className={`rp-tab ${tab === "edit" ? "is-active" : ""}`} onClick={() => setTab("edit")}>
          <I.Ai size={13} /> Edit
        </button>
        <button className={`rp-tab ${tab === "agents" ? "is-active" : ""}`} onClick={() => setTab("agents")}>
          Agents
        </button>
        <div className="rp-tabs__spacer" />
        <button className="rp-iconbtn" title="History"><I.More size={13} /></button>
        <button className="rp-iconbtn" title="Close"><I.Close size={13} /></button>
      </div>

      <div className="rightpanel__model">
        <div className="model-pill">
          <span className="model-pill__dot" />
          <span>Claude · Sonnet 4.5</span>
          <I.ChevronDown size={11} />
        </div>
        <div className="model-meta">
          <span>Context: <b>72%</b></span>
          <span className="model-meta__sep">·</span>
          <span>Workspace indexed</span>
          <I.Check size={11} />
        </div>
      </div>

      <div className="rightpanel__messages">
        {HISTORY.map((m, i) => (
          <div key={i} className={`msg msg--${m.from}`}>
            <div className="msg__avatar">{m.from === "ai" ? <I.Sparkle size={12} /> : "JM"}</div>
            <div className="msg__body">
              <p>{m.text}</p>
              {m.code && (
                <pre className="msg__code"><code>{m.code}</code></pre>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rightpanel__suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion-chip">{s}</button>
        ))}
      </div>

      <div className="rightpanel__composer">
        <div className="composer__inner">
          <textarea
            placeholder="Ask anything, mention files with @, run agents with /…"
            rows={2}
          />
          <div className="composer__actions">
            <button className="composer__btn" title="Mention file">@</button>
            <button className="composer__btn" title="Slash command">/</button>
            <div style={{ flex: 1 }} />
            <button className="composer__send" title="Send (Ctrl+Enter)">
              <I.Send size={13} /> Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

