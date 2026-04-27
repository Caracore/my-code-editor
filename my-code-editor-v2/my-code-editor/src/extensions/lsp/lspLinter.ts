import type { Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { linter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import type { Diagnostic } from "../../lsp/types";
import { DiagnosticSeverity } from "../../lsp/types";

// State effect to update diagnostics
export const setDiagnosticsEffect = StateEffect.define<Diagnostic[]>();

// State field to store current diagnostics
const diagnosticsField = StateField.define<Diagnostic[]>({
  create() {
    return [];
  },
  update(diagnostics, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDiagnosticsEffect)) {
        return effect.value;
      }
    }
    return diagnostics;
  },
});

// Convert LSP diagnostic to CodeMirror diagnostic
function lspDiagnosticToCm(
  doc: { line: (n: number) => { from: number; to: number }; lines: number; length: number },
  diag: Diagnostic
): CmDiagnostic | null {
  try {
    const totalLines = doc.lines;
    const startLineNum = Math.min(Math.max(diag.range.start.line + 1, 1), totalLines);
    const endLineNum = Math.min(Math.max(diag.range.end.line + 1, 1), totalLines);
    const startLine = doc.line(startLineNum);
    const endLine = doc.line(endLineNum);

    let from = Math.min(startLine.from + diag.range.start.character, startLine.to);
    let to = Math.min(endLine.from + diag.range.end.character, endLine.to);

    // CodeMirror requires `to > from` for the underline to render. If the
    // server reports an empty range (e.g. "unused variable" hints), expand
    // by one character so the diagnostic is still visible.
    if (to <= from) {
      if (from < doc.length) {
        to = from + 1;
      } else if (from > 0) {
        from = from - 1;
      }
    }

    let severity: "error" | "warning" | "info" | "hint" = "info";
    switch (diag.severity) {
      case DiagnosticSeverity.Error:
        severity = "error";
        break;
      case DiagnosticSeverity.Warning:
        severity = "warning";
        break;
      case DiagnosticSeverity.Information:
        severity = "info";
        break;
      case DiagnosticSeverity.Hint:
        severity = "hint";
        break;
    }

    return {
      from,
      to,
      severity,
      message: diag.message,
      source: diag.source,
    };
  } catch {
    return null;
  }
}

// LSP linter extension
export function lspLinter(): Extension {
  return [
    diagnosticsField,
    linter((view) => {
      const diagnostics = view.state.field(diagnosticsField);
      const cmDiagnostics: CmDiagnostic[] = [];

      for (const diag of diagnostics) {
        const cmDiag = lspDiagnosticToCm(view.state.doc, diag);
        if (cmDiag) {
          cmDiagnostics.push(cmDiag);
        }
      }

      return cmDiagnostics;
    }, {
      delay: 50,
      // Force the linter to recompute as soon as new LSP diagnostics arrive,
      // not only when the document is edited.
      needsRefresh: (update) =>
        update.transactions.some((tr) =>
          tr.effects.some((e) => e.is(setDiagnosticsEffect))
        ),
    }),
  ];
}

// Helper to update diagnostics in the editor
export function updateDiagnostics(view: EditorView, diagnostics: Diagnostic[]): void {
  view.dispatch({
    effects: setDiagnosticsEffect.of(diagnostics),
  });
}
