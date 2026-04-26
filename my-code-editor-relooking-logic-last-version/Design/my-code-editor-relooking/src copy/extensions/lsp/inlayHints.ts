import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { StateField, StateEffect, Range, RangeSet } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import type { InlayHint, Range as LspRange } from "../../lsp/types";
import { InlayHintKind } from "../../lsp/types";
import { lspManager } from "../../lsp";

// Type alias for decoration set
type DecorationSet = RangeSet<Decoration>;

// State effect to update inlay hints
export const setInlayHintsEffect = StateEffect.define<InlayHint[]>();

// Inlay hint widget
class InlayHintWidget extends WidgetType {
  constructor(
    readonly hint: InlayHint,
    readonly isTypeHint: boolean
  ) {
    super();
  }

  eq(other: InlayHintWidget): boolean {
    return this.getLabel() === other.getLabel() && this.isTypeHint === other.isTypeHint;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = this.isTypeHint ? "cm-inlay-hint cm-inlay-hint-type" : "cm-inlay-hint cm-inlay-hint-parameter";
    
    const label = this.getLabel();
    
    // Add padding based on hint settings
    if (this.hint.paddingLeft) {
      span.style.marginLeft = "2px";
    }
    if (this.hint.paddingRight) {
      span.style.marginRight = "2px";
    }
    
    span.textContent = label;
    
    // Add tooltip if available
    const tooltip = this.getTooltip();
    if (tooltip) {
      span.title = tooltip;
    }
    
    return span;
  }

  private getLabel(): string {
    if (typeof this.hint.label === "string") {
      return this.hint.label;
    }
    return this.hint.label.map(part => part.value).join("");
  }

  private getTooltip(): string | null {
    if (!this.hint.tooltip) return null;
    if (typeof this.hint.tooltip === "string") {
      return this.hint.tooltip;
    }
    return this.hint.tooltip.value;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

// State field to store current inlay hints
const inlayHintsField = StateField.define<InlayHint[]>({
  create() {
    return [];
  },
  update(hints, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setInlayHintsEffect)) {
        return effect.value;
      }
    }
    return hints;
  },
});

// Convert LSP position to CodeMirror offset
function lspPositionToOffset(doc: { line: (n: number) => { from: number } }, line: number, character: number): number {
  try {
    const lineInfo = doc.line(line + 1); // CM6 lines are 1-indexed
    return lineInfo.from + character;
  } catch {
    return 0;
  }
}

// Build decorations from inlay hints
function buildDecorations(view: EditorView, hints: InlayHint[]): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  
  for (const hint of hints) {
    try {
      const pos = lspPositionToOffset(view.state.doc, hint.position.line, hint.position.character);
      
      // Validate position is within document bounds
      if (pos < 0 || pos > view.state.doc.length) continue;
      
      const isTypeHint = hint.kind === InlayHintKind.Type;
      const widget = new InlayHintWidget(hint, isTypeHint);
      
      const deco = Decoration.widget({
        widget,
        side: isTypeHint ? 1 : -1, // Type hints after, parameter hints before
      });
      
      decorations.push(deco.range(pos));
    } catch {
      // Skip invalid hints
    }
  }
  
  // Sort decorations by position
  decorations.sort((a, b) => a.from - b.from);
  
  return Decoration.set(decorations);
}

// Inlay hints decoration plugin
const inlayHintsDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      const hints = view.state.field(inlayHintsField);
      this.decorations = buildDecorations(view, hints);
    }

    update(update: ViewUpdate) {
      // Check if hints changed
      let hintsChanged = false;
      for (const effect of update.transactions.flatMap(t => t.effects)) {
        if (effect.is(setInlayHintsEffect)) {
          hintsChanged = true;
          break;
        }
      }

      if (hintsChanged || update.docChanged || update.viewportChanged) {
        const hints = update.state.field(inlayHintsField);
        this.decorations = buildDecorations(update.view, hints);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Theme for inlay hints
const inlayHintsTheme = EditorView.baseTheme({
  ".cm-inlay-hint": {
    fontFamily: "inherit",
    fontSize: "0.9em",
    padding: "0 4px",
    borderRadius: "3px",
    verticalAlign: "middle",
    opacity: "0.8",
    pointerEvents: "none",
  },
  ".cm-inlay-hint-type": {
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    color: "#4EC9B0", // Type color (teal)
    marginLeft: "2px",
  },
  ".cm-inlay-hint-type::before": {
    content: "': '",
    opacity: "0.7",
  },
  ".cm-inlay-hint-parameter": {
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    color: "#9CDCFE", // Parameter color (light blue)
    marginRight: "2px",
  },
  ".cm-inlay-hint-parameter::after": {
    content: "':'",
    opacity: "0.7",
  },
});

// LSP inlay hints extension
export function lspInlayHints(): Extension {
  return [
    inlayHintsField,
    inlayHintsDecorations,
    inlayHintsTheme,
  ];
}

// Helper to update inlay hints in the editor
export function updateInlayHints(view: EditorView, hints: InlayHint[]): void {
  view.dispatch({
    effects: setInlayHintsEffect.of(hints),
  });
}

// Helper to get visible range for LSP request
export function getVisibleRange(view: EditorView): LspRange {
  const { from, to } = view.viewport;
  const doc = view.state.doc;
  
  const fromLine = doc.lineAt(from);
  const toLine = doc.lineAt(Math.min(to, doc.length));
  
  return {
    start: {
      line: fromLine.number - 1, // LSP uses 0-indexed lines
      character: 0,
    },
    end: {
      line: toLine.number - 1,
      character: toLine.length,
    },
  };
}

// Create inlay hints provider that fetches from LSP
export function createInlayHintsProvider(
  getFilePath: () => string | null
): Extension {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastFetchTime = 0;
  const DEBOUNCE_MS = 250;
  const MIN_FETCH_INTERVAL_MS = 500;

  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        this.fetchHints(view);
      }

      update(update: ViewUpdate) {
        // Fetch hints on document change or viewport change
        if (update.docChanged || update.viewportChanged) {
          this.scheduleFetch(update.view);
        }
      }

      scheduleFetch(view: EditorView) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          this.fetchHints(view);
        }, DEBOUNCE_MS);
      }

      async fetchHints(view: EditorView) {
        const filePath = getFilePath();
        if (!filePath) return;

        // Rate limit requests
        const now = Date.now();
        if (now - lastFetchTime < MIN_FETCH_INTERVAL_MS) {
          this.scheduleFetch(view);
          return;
        }
        lastFetchTime = now;

        try {
          const range = getVisibleRange(view);
          const hints = await lspManager.getInlayHints(filePath, range);
          
          // Only update if we got hints and view is still valid
          if (hints.length > 0 && !view.destroyed) {
            updateInlayHints(view, hints);
          } else if (hints.length === 0 && !view.destroyed) {
            // Clear hints if none returned
            updateInlayHints(view, []);
          }
        } catch (error) {
          console.error("[InlayHints] Failed to fetch:", error);
        }
      }

      destroy() {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
      }
    }
  );
}
