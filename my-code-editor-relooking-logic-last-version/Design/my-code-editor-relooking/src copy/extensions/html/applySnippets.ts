import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

/**
 * Remplace la plage [from, to] par le snippet
 * Gère ${1:placeholder} comme position finale du curseur
 * Supprime les autres ${n:...} / ${n}
 */
export function applySnippet(
  view: EditorView,
  snippet: string,
  from: number,
  to: number
) {
  // 1. Tabstop principal ${1:...}
  const mainMatch = snippet.match(/\$\{1:(.*?)\}/);
  let cursorOffset: number | null = null;

  if (mainMatch) {
    const placeholder = mainMatch[1];
    const full = mainMatch[0];

    const index = snippet.indexOf(full);
    if (index !== -1) {
      cursorOffset = index + placeholder.length;
      snippet = snippet.replace(full, placeholder);
    }
  }

  // 2. Autres tabstops ${2:...}, ${3}, etc.
  snippet = snippet.replace(/\$\{\d+:?(.*?)\}/g, "$1");

  // 3. Remplacement dans le doc
  const change = { from, to, insert: snippet };

  if (cursorOffset != null) {
    const pos = from + cursorOffset;

    view.dispatch({
      changes: change,
      selection: EditorSelection.single(pos)
    });
  } else {
    view.dispatch({
      changes: change
    });
  }
}
