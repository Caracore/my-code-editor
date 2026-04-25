import { EditorView, hoverTooltip, Decoration, ViewPlugin, type DecorationSet } from "@codemirror/view";
import { StateEffect, StateField, type Extension } from "@codemirror/state";
import { lspManager } from "../../lsp";
import type { Hover, MarkupContent } from "../../lsp";

/**
 * Hover tooltip LSP : affiche au survol :
 * - les diagnostics (erreurs/warnings) sur la position
 * - la réponse LSP `textDocument/hover` (signature, doc, type)
 *
 * Ctrl+hover : souligne le mot survolé pour indiquer qu'il est "goto-able".
 */

function hoverContentToString(contents: Hover["contents"]): string {
  const toStr = (c: string | MarkupContent): string =>
    typeof c === "string" ? c : c.value;
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) return contents.map(toStr).join("\n\n");
  return toStr(contents);
}

function renderMarkdownLite(text: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "cm-lsp-hover-content";

  // Découpe en blocs de code ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);
  for (const part of parts) {
    if (!part) continue;
    const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (codeMatch) {
      const pre = document.createElement("pre");
      pre.className = "cm-lsp-hover-code";
      pre.textContent = codeMatch[2].replace(/\n$/, "");
      wrapper.appendChild(pre);
    } else {
      const p = document.createElement("div");
      p.className = "cm-lsp-hover-text";
      // Conversion minimale : `inline code`
      const html = part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`([^`]+)`/g, '<code class="cm-lsp-hover-inline-code">$1</code>')
        .replace(/\n/g, "<br/>");
      p.innerHTML = html;
      wrapper.appendChild(p);
    }
  }
  return wrapper;
}

/** Hover tooltip qui affiche le `textDocument/hover` LSP.
 *  Note : on n'inclut PAS les diagnostics ici — la gouttière de diagnostics
 *  et la tooltip native du linter CodeMirror s'en chargent déjà, et
 *  rust-analyzer inclut souvent les infos de diagnostic dans sa propre
 *  réponse hover (sinon on aurait des doublons). */
export function lspHoverTooltip(getFilePath: () => string | null): Extension {
  return hoverTooltip(
    async (view, pos) => {
      const filePath = getFilePath();
      if (!filePath) return null;

      let hoverText = "";
      try {
        const line = view.state.doc.lineAt(pos);
        const result = await lspManager
          .getClient(getLspLangFromPath(filePath) ?? "")
          ?.getHover(filePath, {
            line: line.number - 1,
            character: pos - line.from,
          });
        if (result?.contents) {
          hoverText = hoverContentToString(result.contents).trim();
        }
      } catch (err) {
        console.error("[lspHoverTooltip] error:", err);
      }

      if (!hoverText) return null;

      return {
        pos,
        above: true,
        create() {
          const dom = document.createElement("div");
          dom.className = "cm-lsp-hover-tooltip";
          dom.appendChild(renderMarkdownLite(hoverText));
          return { dom };
        },
      };
    },
    { hoverTime: 300 }
  );
}

function getLspLangFromPath(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py":
      return "python";
    case "rs":
      return "rust";
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    default:
      return null;
  }
}

// --- Ctrl+hover : soulignement de symbole "goto-able" ---

const setCtrlHoverEffect = StateEffect.define<{ from: number; to: number } | null>();

const ctrlHoverDecoration = Decoration.mark({
  class: "cm-lsp-goto-link",
});

const ctrlHoverField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setCtrlHoverEffect)) {
        if (!e.value) {
          deco = Decoration.none;
        } else {
          deco = Decoration.set([
            ctrlHoverDecoration.range(e.value.from, e.value.to),
          ]);
        }
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const ctrlHoverPlugin = ViewPlugin.fromClass(
  class {
    constructor(public view: EditorView) {}
    update() {}
  },
  {
    eventHandlers: {
      mousemove(event, view) {
        if (!(event.ctrlKey || event.metaKey)) {
          if (view.state.field(ctrlHoverField, false)?.size) {
            view.dispatch({ effects: setCtrlHoverEffect.of(null) });
          }
          return;
        }
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return;
        const word = view.state.wordAt(pos);
        if (!word) {
          view.dispatch({ effects: setCtrlHoverEffect.of(null) });
          return;
        }
        const current = view.state.field(ctrlHoverField, false);
        let alreadySet = false;
        current?.between(word.from, word.to, (f, t) => {
          if (f === word.from && t === word.to) alreadySet = true;
        });
        if (!alreadySet) {
          view.dispatch({
            effects: setCtrlHoverEffect.of({ from: word.from, to: word.to }),
          });
        }
      },
      mouseleave(_event, view) {
        if (view.state.field(ctrlHoverField, false)?.size) {
          view.dispatch({ effects: setCtrlHoverEffect.of(null) });
        }
      },
      keyup(event, view) {
        if (event.key === "Control" || event.key === "Meta") {
          view.dispatch({ effects: setCtrlHoverEffect.of(null) });
        }
      },
    },
  }
);

export function ctrlClickGotoHighlight(): Extension {
  return [ctrlHoverField, ctrlHoverPlugin];
}

// --- Thème ---

export function lspHoverTheme(): Extension {
  return EditorView.baseTheme({
    ".cm-lsp-hover-tooltip": {
      maxWidth: "560px",
      padding: "6px 10px",
      fontSize: "12.5px",
      lineHeight: "1.45",
    },
    ".cm-lsp-hover-diag": {
      padding: "2px 0",
      whiteSpace: "pre-wrap",
    },
    ".cm-lsp-hover-diag-error": { color: "#f48771" },
    ".cm-lsp-hover-diag-warning": { color: "#cca700" },
    ".cm-lsp-hover-diag-info": { color: "#4fc1ff" },
    ".cm-lsp-hover-diag-hint": { color: "#9ca3af" },
    ".cm-lsp-hover-sep": {
      height: "1px",
      margin: "6px 0",
      background: "rgba(255, 255, 255, 0.1)",
    },
    ".cm-lsp-hover-content": {
      whiteSpace: "normal",
    },
    ".cm-lsp-hover-text": {
      whiteSpace: "normal",
    },
    ".cm-lsp-hover-code": {
      margin: "4px 0",
      padding: "6px 8px",
      background: "rgba(255, 255, 255, 0.06)",
      borderRadius: "3px",
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: "12px",
      whiteSpace: "pre",
      overflowX: "auto",
    },
    ".cm-lsp-hover-inline-code": {
      padding: "1px 4px",
      background: "rgba(255, 255, 255, 0.08)",
      borderRadius: "3px",
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: "12px",
    },
    ".cm-lsp-goto-link": {
      textDecoration: "underline",
      textDecorationColor: "#4fc1ff",
      textUnderlineOffset: "2px",
      cursor: "pointer",
      color: "#4fc1ff",
    },
  });
}
