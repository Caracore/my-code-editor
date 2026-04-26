import { gutter, GutterMarker, EditorView, hoverTooltip } from "@codemirror/view";
import { type Extension } from "@codemirror/state";
import { forEachDiagnostic, type Diagnostic as CmDiagnostic } from "@codemirror/lint";

/**
 * Gouttière de diagnostics (erreurs/warnings du linter LSP).
 * - Affiche une icône par ligne en fonction de la sévérité maximale
 * - Survol de l'icône : tooltip avec les messages
 */

const SEVERITY_RANK: Record<CmDiagnostic["severity"], number> = {
  hint: 0,
  info: 1,
  warning: 2,
  error: 3,
};

class DiagnosticMarker extends GutterMarker {
  constructor(
    readonly severity: CmDiagnostic["severity"],
    readonly messages: string[]
  ) {
    super();
  }

  eq(other: GutterMarker): boolean {
    return (
      other instanceof DiagnosticMarker &&
      other.severity === this.severity &&
      other.messages.length === this.messages.length &&
      other.messages.every((m, i) => m === this.messages[i])
    );
  }

  toDOM() {
    const el = document.createElement("div");
    el.className = `cm-diagnostic-marker cm-diagnostic-marker-${this.severity}`;
    el.title = this.messages.join("\n\n");
    el.textContent = iconFor(this.severity);
    return el;
  }
}

function iconFor(sev: CmDiagnostic["severity"]): string {
  switch (sev) {
    case "error":
      return "✖";
    case "warning":
      return "⚠";
    case "info":
      return "ⓘ";
    case "hint":
      return "•";
  }
}

/** Construit une map ligne -> diagnostics (sévérité max + messages) */
function collectLineDiagnostics(view: EditorView): Map<number, DiagnosticMarker> {
  const byLine = new Map<number, { sev: CmDiagnostic["severity"]; msgs: string[] }>();
  forEachDiagnostic(view.state, (diag, from) => {
    const line = view.state.doc.lineAt(from).number;
    const entry = byLine.get(line);
    const msg = diag.source ? `[${diag.source}] ${diag.message}` : diag.message;
    if (!entry) {
      byLine.set(line, { sev: diag.severity, msgs: [msg] });
    } else {
      entry.msgs.push(msg);
      if (SEVERITY_RANK[diag.severity] > SEVERITY_RANK[entry.sev]) {
        entry.sev = diag.severity;
      }
    }
  });

  const result = new Map<number, DiagnosticMarker>();
  for (const [line, info] of byLine) {
    result.set(line, new DiagnosticMarker(info.sev, info.msgs));
  }
  return result;
}

// Tooltip au survol des marqueurs (ex. clic ailleurs aussi)
const diagnosticHoverTooltip = hoverTooltip((view, pos) => {
  const lineNum = view.state.doc.lineAt(pos).number;
  const messages: { sev: CmDiagnostic["severity"]; msg: string }[] = [];
  forEachDiagnostic(view.state, (diag, from) => {
    if (view.state.doc.lineAt(from).number === lineNum) {
      const msg = diag.source ? `[${diag.source}] ${diag.message}` : diag.message;
      messages.push({ sev: diag.severity, msg });
    }
  });
  if (messages.length === 0) return null;
  return {
    pos,
    above: true,
    create() {
      const dom = document.createElement("div");
      dom.className = "cm-diagnostic-hover-tooltip";
      for (const { sev, msg } of messages) {
        const item = document.createElement("div");
        item.className = `cm-diagnostic-hover-item cm-diagnostic-hover-${sev}`;
        item.textContent = `${iconFor(sev)} ${msg}`;
        dom.appendChild(item);
      }
      return { dom };
    },
  };
});

export function diagnosticsGutter(): Extension {
  return [
    gutter({
      class: "cm-diagnostics-gutter",
      lineMarker(view, line) {
        const map = collectLineDiagnostics(view);
        const lineNum = view.state.doc.lineAt(line.from).number;
        return map.get(lineNum) ?? null;
      },
      initialSpacer: () => new DiagnosticMarker("error", [""]),
    }),
    diagnosticHoverTooltip,
    EditorView.baseTheme({
      ".cm-diagnostics-gutter": {
        width: "18px",
      },
      ".cm-diagnostic-marker": {
        textAlign: "center",
        fontSize: "12px",
        lineHeight: "1",
        padding: "2px 0",
        cursor: "help",
      },
      ".cm-diagnostic-marker-error": { color: "#f48771" },
      ".cm-diagnostic-marker-warning": { color: "#cca700" },
      ".cm-diagnostic-marker-info": { color: "#4fc1ff" },
      ".cm-diagnostic-marker-hint": { color: "#858585" },
      ".cm-diagnostic-hover-tooltip": {
        padding: "6px 8px",
        maxWidth: "480px",
        fontSize: "12px",
        lineHeight: "1.4",
        whiteSpace: "pre-wrap",
      },
      ".cm-diagnostic-hover-item": {
        padding: "2px 0",
      },
      ".cm-diagnostic-hover-error": { color: "#f48771" },
      ".cm-diagnostic-hover-warning": { color: "#cca700" },
      ".cm-diagnostic-hover-info": { color: "#4fc1ff" },
      ".cm-diagnostic-hover-hint": { color: "#858585" },
    }),
  ];
}
