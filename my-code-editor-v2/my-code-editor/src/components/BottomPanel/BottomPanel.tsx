import { useMemo, useRef, useState } from "react";
import { I } from "../Icons";
import TerminalView from "./TerminalView";
import { useWorkspace } from "../../context/WorkspaceContext";
import "./BottomPanel.css";

const TABS = [
  { id: "terminal", label: "Terminal", icon: <I.Terminal size={13} /> },
  { id: "problems", label: "Problems", icon: <I.Error size={13} />, badge: 2 },
  { id: "output",   label: "Output",   icon: <I.More size={13} /> },
  { id: "debug",    label: "Debug",    icon: <I.Debug size={13} /> },
  { id: "git",      label: "Git",      icon: <I.Git size={13} /> },
];

let nextTermSeq = 1;
const newTermId = () => `term-${Date.now().toString(36)}-${nextTermSeq++}`;

interface BottomPanelProps {
  onClose?: () => void;
}

export default function BottomPanel({ onClose }: BottomPanelProps = {}) {
  const [tab, setTab] = useState("terminal");
  const { rootPath } = useWorkspace();

  // One or more PTY-backed terminal sessions. Always keep at least one.
  const initialId = useRef(newTermId()).current;
  const [terminals, setTerminals] = useState<string[]>([initialId]);
  const [activeTerm, setActiveTerm] = useState<string>(initialId);

  const addTerminal = () => {
    const id = newTermId();
    setTerminals((prev) => [...prev, id]);
    setActiveTerm(id);
    setTab("terminal");
  };
  const closeTerminal = (id: string) => {
    setTerminals((prev) => {
      const next = prev.filter((t) => t !== id);
      const fallback = next.length === 0 ? newTermId() : next[next.length - 1];
      if (next.length === 0) {
        setActiveTerm(fallback);
        return [fallback];
      }
      if (id === activeTerm) setActiveTerm(fallback);
      return next;
    });
  };

  const termLabels = useMemo(
    () => terminals.map((id, i) => ({ id, label: `shell ${i + 1}` })),
    [terminals],
  );

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
        <button className="bp-iconbtn" title="New terminal" onClick={addTerminal}>
          <I.Plus size={13} />
        </button>
        <button className="bp-iconbtn" title="Split"><I.Split size={13} /></button>
        <button
          className="bp-iconbtn"
          title="Kill terminal"
          onClick={() => closeTerminal(activeTerm)}
        >
          <I.Trash size={13} />
        </button>
        <button className="bp-iconbtn" title="Close panel" onClick={onClose}>
          <I.Close size={13} />
        </button>
      </div>

      {tab === "terminal" && (
        <div className="bp-terminal-wrap">
          {terminals.length > 1 && (
            <div className="bp-term-list">
              {termLabels.map(({ id, label }) => (
                <button
                  key={id}
                  className={`bp-term-list__item ${id === activeTerm ? "is-active" : ""}`}
                  onClick={() => setActiveTerm(id)}
                  title={label}
                >
                  <I.Terminal size={11} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="bp-term-host">
            {terminals.map((id) => (
              <div
                key={id}
                className={`bp-term-pane ${id === activeTerm ? "is-active" : ""}`}
              >
                <TerminalView sessionId={id} cwd={rootPath} />
              </div>
            ))}
          </div>
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


