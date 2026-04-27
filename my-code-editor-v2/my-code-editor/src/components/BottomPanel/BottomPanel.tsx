import { useEffect, useMemo, useRef, useState } from "react";
import { I } from "../Icons";
import TerminalView from "./TerminalView";
import ProblemsView, { useProblemsCount } from "./ProblemsView";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useUserSettings } from "../../context/UserSettingsContext";
import ResizeHandle from "../ResizeHandle/ResizeHandle";
import "./BottomPanel.css";

const TABS = [
  { id: "terminal", label: "Terminal", icon: <I.Terminal size={13} /> },
  { id: "problems", label: "Problems", icon: <I.Error size={13} /> },
  { id: "output",   label: "Output",   icon: <I.More size={13} /> },
  { id: "debug",    label: "Debug",    icon: <I.Debug size={13} /> },
  { id: "git",      label: "Git",      icon: <I.Git size={13} /> },
];

let nextTermSeq = 1;
const newTermId = () => `term-${Date.now().toString(36)}-${nextTermSeq++}`;

interface BottomPanelProps {
  onClose?: () => void;
  height?: number;
  onResize?: (h: number) => void;
}

export default function BottomPanel({ onClose, height, onResize }: BottomPanelProps = {}) {
  const [tab, setTab] = useState("terminal");
  const { rootPath } = useWorkspace();
  const { settings } = useUserSettings();
  const problemsCount = useProblemsCount();

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

  // Listen to global signals from shortcuts / menus.
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onNew = () => addTerminal();
    const onFocus = () => {
      setTab("terminal");
      // xterm renders a hidden textarea; clicking the host gives it focus
      // (TerminalView attaches its own click->focus listener).
      requestAnimationFrame(() => {
        const ta = hostRef.current?.querySelector(
          ".bp-term-pane.is-active .xterm-helper-textarea",
        ) as HTMLTextAreaElement | null;
        ta?.focus();
      });
    };
    window.addEventListener("terminal:new", onNew);
    window.addEventListener("terminal:focus", onFocus);
    return () => {
      window.removeEventListener("terminal:new", onNew);
      window.removeEventListener("terminal:focus", onFocus);
    };
  }, []);

  return (
    <section className="bottompanel" ref={hostRef}>
      {height !== undefined && onResize && (
        <ResizeHandle edge="top" size={height} onResize={onResize} min={120} max={800} />
      )}
      <div className="bottompanel__tabs">
        {TABS.map((t) => {
          const badge = t.id === "problems" && problemsCount > 0 ? problemsCount : null;
          return (
            <button
              key={t.id}
              className={`bp-tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
              {badge !== null && <span className="bp-tab__badge">{badge}</span>}
            </button>
          );
        })}
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

      {tab === "problems" && <ProblemsView disabled={!settings.lspEnabled} />}

      {tab !== "terminal" && tab !== "problems" && (
        <div className="bp-empty">No content for "{tab}" yet.</div>
      )}
    </section>
  );
}


