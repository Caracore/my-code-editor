import { useEffect, useState, useMemo } from "react";
import { I } from "../Icons";
import { lspManager } from "../../lsp";
import { DiagnosticSeverity } from "../../lsp";
import type { Diagnostic } from "../../lsp";
import { useWorkspace } from "../../context/WorkspaceContext";

/** Map of file path -> diagnostics emitted by every LSP client. */
type DiagnosticsMap = Map<string, { path: string; list: Diagnostic[] }>;

interface ProblemsViewProps {
  /** Visual hint for the empty state. Filled when LSP is disabled in settings. */
  disabled?: boolean;
}

/**
 * Live view of the diagnostics published by every running LSP server.
 * Subscribes to `lspManager.onDiagnostics` and renders one row per problem.
 */
export default function ProblemsView({ disabled }: ProblemsViewProps) {
  const [diags, setDiags] = useState<DiagnosticsMap>(new Map());
  const { openFile } = useWorkspace();

  useEffect(() => {
    const unsub = lspManager.onDiagnostics((path, list) => {
      // Normalise so the same file reported by different LSP servers /
      // path casings collapses into a single entry.
      const key = path.toLowerCase();
      setDiags((prev) => {
        const next = new Map(prev);
        if (list.length === 0) {
          next.delete(key);
        } else {
          next.set(key, { path, list });
        }
        return next;
      });
    });
    return unsub;
  }, []);

  const flat = useMemo(() => {
    const rows: { path: string; diag: Diagnostic }[] = [];
    for (const { path, list } of diags.values()) {
      for (const d of list) rows.push({ path, diag: d });
    }
    rows.sort((a, b) => {
      const sa = a.diag.severity ?? 99;
      const sb = b.diag.severity ?? 99;
      if (sa !== sb) return sa - sb;
      return a.path.localeCompare(b.path);
    });
    return rows;
  }, [diags]);

  if (disabled) {
    return (
      <div className="bp-empty">
        LSP is disabled. Enable it in <strong>Settings → Behaviour</strong> to see diagnostics here.
      </div>
    );
  }

  if (flat.length === 0) {
    return <div className="bp-empty">No problems detected.</div>;
  }

  return (
    <div className="problems">
      {flat.map(({ path, diag }, i) => {
        const sev = diag.severity ?? DiagnosticSeverity.Information;
        const cls =
          sev === DiagnosticSeverity.Error
            ? "problem-row--err"
            : sev === DiagnosticSeverity.Warning
              ? "problem-row--warn"
              : "problem-row--info";
        const Icon =
          sev === DiagnosticSeverity.Error
            ? I.Error
            : sev === DiagnosticSeverity.Warning
              ? I.Warn
              : I.More;
        const fileName = path.split(/[/\\]/).pop() || path;
        const line = diag.range.start.line + 1;
        const col = diag.range.start.character + 1;
        return (
          <button
            key={`${path}-${i}`}
            className={`problem-row ${cls}`}
            onClick={() => openFile(path)}
            title={path}
          >
            <Icon size={13} />
            <span className="problem-row__file">{fileName}</span>
            <span className="problem-row__line">{line}:{col}</span>
            <span className="problem-row__msg">{diag.message}</span>
            {diag.source && <span className="problem-row__src">{diag.source}{diag.code ? `(${diag.code})` : ""}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Hook used by the bottom-panel tab bar to display the live problem count. */
export function useProblemsCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const map = new Map<string, number>();
    const unsub = lspManager.onDiagnostics((path, list) => {
      if (list.length === 0) map.delete(path);
      else map.set(path, list.length);
      let total = 0;
      for (const n of map.values()) total += n;
      setCount(total);
    });
    return unsub;
  }, []);
  return count;
}
