import { EditorView, keymap } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { lspManager } from "../../lsp";

/**
 * Évènement émis quand l'utilisateur veut "aller à la définition".
 * L'app principale doit écouter cet évènement, ouvrir le fichier cible
 * (s'il n'est pas déjà ouvert), puis émettre `editor:goto-position` pour
 * positionner le curseur.
 *
 * detail: { path: string, line: number, character: number }
 *   - line / character sont 0-based (convention LSP).
 */
export const LSP_GOTO_DEFINITION_EVENT = "lsp:goto-definition";

/**
 * Évènement écouté par les éditeurs pour positionner le curseur sur une
 * position après ouverture du fichier.
 *
 * detail: { path: string, line: number, character: number }
 */
export const EDITOR_GOTO_POSITION_EVENT = "editor:goto-position";

function uriToPath(uri: string): string {
  let path = uri.replace(/^file:\/\/\/?/, "");
  path = decodeURIComponent(path);
  // Sur Windows, restaurer les antislashs
  if (/^[a-zA-Z]:/.test(path)) {
    return path.replace(/\//g, "\\");
  }
  return path;
}

async function triggerGotoDefinition(
  view: EditorView,
  pos: number,
  getFilePath: () => string | null
): Promise<boolean> {
  const filePath = getFilePath();
  if (!filePath) return false;

  const line = view.state.doc.lineAt(pos);
  const lspPos = {
    line: line.number - 1,
    character: pos - line.from,
  };

  try {
    const locations = await lspManager.getDefinition(filePath, lspPos);
    if (!locations || locations.length === 0) return false;

    const loc = locations[0];
    const targetPath = uriToPath(loc.uri);
    const targetLine = loc.range.start.line;
    const targetChar = loc.range.start.character;

    window.dispatchEvent(
      new CustomEvent(LSP_GOTO_DEFINITION_EVENT, {
        detail: { path: targetPath, line: targetLine, character: targetChar },
      })
    );
    return true;
  } catch (err) {
    console.error("[gotoDefinition] error:", err);
    return false;
  }
}

/**
 * Crée l'extension Goto-Definition.
 * - F12 : aller à la définition à la position du curseur
 * - Ctrl/Cmd + clic : aller à la définition du token cliqué
 */
export function gotoDefinitionExtension(
  getFilePath: () => string | null
): Extension {
  return [
    keymap.of([
      {
        key: "F12",
        run: (view) => {
          const pos = view.state.selection.main.head;
          void triggerGotoDefinition(view, pos, getFilePath);
          return true;
        },
      },
      {
        key: "Mod-F12",
        run: (view) => {
          const pos = view.state.selection.main.head;
          void triggerGotoDefinition(view, pos, getFilePath);
          return true;
        },
      },
    ]),
    EditorView.domEventHandlers({
      mousedown(event, view) {
        if (!(event.ctrlKey || event.metaKey)) return false;
        if (event.button !== 0) return false;
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return false;
        event.preventDefault();
        void triggerGotoDefinition(view, pos, getFilePath);
        return true;
      },
    }),
    EditorView.baseTheme({
      ".cm-content": {
        // Pas de style global imposé : on laisse le curseur normal.
      },
    }),
  ];
}

/**
 * Applique une position (LSP, 0-based) au curseur de la vue, en scrollant
 * la ligne au centre. À utiliser depuis l'écouteur d'`editor:goto-position`
 * dans le composant éditeur.
 */
export function applyGotoPosition(
  view: EditorView,
  line: number,
  character: number
): void {
  const docLines = view.state.doc.lines;
  const targetLineNum = Math.min(Math.max(line + 1, 1), docLines);
  const lineObj = view.state.doc.line(targetLineNum);
  const pos = Math.min(lineObj.from + Math.max(character, 0), lineObj.to);

  view.dispatch({
    selection: { anchor: pos },
    effects: EditorView.scrollIntoView(pos, { y: "center" }),
  });
  view.focus();
}
