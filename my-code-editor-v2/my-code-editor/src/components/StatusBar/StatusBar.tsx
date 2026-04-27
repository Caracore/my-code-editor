import { useEffect, useMemo, useState } from "react";
import { I } from "../Icons";
import { usePlugins } from "../../plugins/PluginsContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useProblemsCount } from "../BottomPanel/ProblemsView";
import { lspManager, DiagnosticSeverity } from "../../lsp";
import "./StatusBar.css";

interface StatusBarProps {
  terminalOpen?: boolean;
  rightOpen?: boolean;
  onToggleTerminal?: () => void;
  onToggleRight?: () => void;
  onOpenSettings?: () => void;
}

/** Pretty label for an internal language id. */
function languageLabel(lang: string | undefined, ext: string | undefined): string {
  if (!lang && !ext) return "Plain Text";
  switch (lang) {
    case "tsx": return ext === "ts" ? "TypeScript" : "TypeScript JSX";
    case "jsx": return ext === "js" ? "JavaScript" : "JavaScript JSX";
    case "typescript": return "TypeScript";
    case "javascript": return "JavaScript";
    case "css": return "CSS";
    case "html": return "HTML";
    case "json": return "JSON";
    case "python": return "Python";
    case "rust": return "Rust";
    case "cpp": return "C/C++";
    case "markdown": return "Markdown";
    case "toml": return "TOML";
    case "plaintext": return "Plain Text";
    default: return lang ? lang[0].toUpperCase() + lang.slice(1) : "Plain Text";
  }
}

export default function StatusBar({
  terminalOpen = true,
  rightOpen = true,
  onToggleTerminal,
  onToggleRight,
  onOpenSettings,
}: StatusBarProps = {}) {
  const { statusItemsLeft, statusItemsRight } = usePlugins();
  const { activeTab } = useWorkspace();
  const problemsCount = useProblemsCount();

  // Split problems into errors vs warnings/info so the dedicated badges
  // in the status bar stay accurate.
  const [errCount, warnCount] = useMemo(() => {
    let err = 0;
    let warn = 0;
    for (const { diagnostics } of lspManager.getAllDiagnostics()) {
      for (const d of diagnostics) {
        if (d.severity === DiagnosticSeverity.Error) err++;
        else warn++;
      }
    }
    return [err, warn];
    // Recompute whenever the total changes.
  }, [problemsCount]);

  // Some plugins (like the built-in clock) emit ticks via a custom event so
  // their `render()` returns up-to-date content without re-registering.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const onTick = () => forceTick((n) => n + 1);
    window.addEventListener("plugins:status-tick", onTick);
    return () => window.removeEventListener("plugins:status-tick", onTick);
  }, []);

  const langLabel = languageLabel(activeTab?.language, activeTab?.ext);

  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <button className="sb-item" title="Git branch">
          <I.Branch size={12} /> <span>main</span>
          <span className="sb-mut">↑1 ↓0</span>
        </button>
        <button
          className="sb-item sb-item--err"
          title={`${errCount} error${errCount === 1 ? "" : "s"}`}
          onClick={() => window.dispatchEvent(new CustomEvent("bottompanel:focus", { detail: "problems" }))}
        >
          <I.Error size={12} /> {errCount}
        </button>
        <button
          className="sb-item sb-item--warn"
          title={`${warnCount} warning${warnCount === 1 ? "" : "s"}`}
          onClick={() => window.dispatchEvent(new CustomEvent("bottompanel:focus", { detail: "problems" }))}
        >
          <I.Warn size={12} /> {warnCount}
        </button>
        <button className="sb-item">
          <I.Sparkle size={12} /> AI ready
        </button>
        {statusItemsLeft.map((it) => (
          <button
            key={it.id}
            className="sb-item sb-item--plugin"
            title={it.tooltip}
            onClick={it.onClick}
          >
            {it.render()}
          </button>
        ))}
      </div>

      <div className="statusbar__center">
        <span className="sb-task">
          <span className="sb-task__spinner" />
          Indexing workspace · 84%
        </span>
      </div>

      <div className="statusbar__group">
        <button className="sb-item">Ln 1, Col 1</button>
        <button className="sb-item">Spaces: 2</button>
        <button className="sb-item">UTF-8</button>
        <button className="sb-item">LF</button>
        <button className="sb-item" title={activeTab?.path ?? "No file"}>
          {langLabel}
        </button>
        {statusItemsRight.map((it) => (
          <button
            key={it.id}
            className="sb-item sb-item--plugin"
            title={it.tooltip}
            onClick={it.onClick}
          >
            {it.render()}
          </button>
        ))}
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
        <button
          className="sb-item"
          title="Settings (Ctrl+,)"
          onClick={onOpenSettings}
        >
          <I.Settings size={12} />
        </button>
      </div>
    </footer>
  );
}


