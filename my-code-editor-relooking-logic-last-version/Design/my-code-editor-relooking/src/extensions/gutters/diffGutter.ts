import { gutter, GutterMarker, EditorView } from "@codemirror/view";
import {
  StateEffect,
  StateField,
  type Extension,
} from "@codemirror/state";

/**
 * Gouttière "diff" : indique pour chaque ligne si elle a été
 * - ajoutée (vert)
 * - modifiée (jaune/orange)
 * - supprimée juste avant (rouge, marqueur fin sur la ligne suivante)
 *
 * La référence est la "baseline" (typiquement le contenu sauvegardé sur disque).
 * Appelez `setDiffBaseline(view, content)` pour mettre à jour la référence
 * (par exemple lors de la sauvegarde, ou à l'ouverture du fichier).
 */

export type DiffStatus = "added" | "modified" | "deleted-before" | "unchanged";

export const setDiffBaselineEffect = StateEffect.define<string>();

interface DiffState {
  baseline: string;
  baselineLines: string[];
}

const diffState = StateField.define<DiffState>({
  create() {
    return { baseline: "", baselineLines: [""] };
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setDiffBaselineEffect)) {
        return {
          baseline: e.value,
          baselineLines: e.value.split(/\r?\n/),
        };
      }
    }
    return value;
  },
});

class DiffMarker extends GutterMarker {
  constructor(readonly status: Exclude<DiffStatus, "unchanged">) {
    super();
  }
  eq(other: GutterMarker): boolean {
    return other instanceof DiffMarker && other.status === this.status;
  }
  toDOM() {
    const el = document.createElement("div");
    el.className = `cm-diff-marker cm-diff-${this.status}`;
    return el;
  }
}

const addedMarker = new DiffMarker("added");
const modifiedMarker = new DiffMarker("modified");
const deletedBeforeMarker = new DiffMarker("deleted-before");

/**
 * Diff ligne par ligne très simple basé sur la "plus longue sous-séquence
 * commune" via une approche rapide (Myers simplifié) — suffisant pour des
 * fichiers de taille raisonnable.
 */
function computeLineStatuses(
  baseline: string[],
  current: string[]
): DiffStatus[] {
  const n = baseline.length;
  const m = current.length;
  const statuses: DiffStatus[] = new Array(m).fill("unchanged");

  // Cas dégénéré
  if (n === 0) {
    return statuses.map(() => "added" as DiffStatus);
  }

  // LCS DP — limité aux fichiers raisonnables, sinon on tombe sur une
  // heuristique line-by-line pour éviter de geler l'éditeur.
  const MAX_DP = 1500;
  if (n > MAX_DP || m > MAX_DP) {
    for (let i = 0; i < m; i++) {
      if (i >= n || baseline[i] !== current[i]) {
        statuses[i] = i < n ? "modified" : "added";
      }
    }
    return statuses;
  }

  const dp: Uint16Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Uint16Array(m + 1);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (baseline[i - 1] === current[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack pour obtenir les opérations
  type Op = { type: "equal" | "add" | "del"; line?: number };
  const ops: Op[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (baseline[i - 1] === current[j - 1]) {
      ops.push({ type: "equal", line: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: "del" });
      i--;
    } else {
      ops.push({ type: "add", line: j - 1 });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ type: "del" });
    i--;
  }
  while (j > 0) {
    ops.push({ type: "add", line: j - 1 });
    j--;
  }
  ops.reverse();

  // Détecte modifications (add suivi de del adjacents → "modified")
  // et suppressions (del isolé → marquage "deleted-before" sur la ligne
  // courante du fichier).
  let pendingDelBeforeNextCurrentLine = false;
  let lastEqualOrAddIndex = -1; // index de la dernière ligne "current" rencontrée

  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    if (op.type === "equal") {
      if (pendingDelBeforeNextCurrentLine && op.line !== undefined) {
        statuses[op.line] = "deleted-before";
        pendingDelBeforeNextCurrentLine = false;
      }
      lastEqualOrAddIndex = op.line ?? lastEqualOrAddIndex;
    } else if (op.type === "add") {
      if (op.line === undefined) continue;
      // Si juste avant on avait une suppression, on combine en "modified"
      if (pendingDelBeforeNextCurrentLine) {
        statuses[op.line] = "modified";
        pendingDelBeforeNextCurrentLine = false;
      } else {
        statuses[op.line] = "added";
      }
      lastEqualOrAddIndex = op.line;
    } else {
      // del : on retient pour marquer la prochaine ligne courante.
      // Si pas de prochaine ligne, on marque la dernière vue.
      pendingDelBeforeNextCurrentLine = true;
    }
  }

  if (pendingDelBeforeNextCurrentLine && lastEqualOrAddIndex >= 0) {
    // Suppression à la fin du fichier : marquer la dernière ligne comme
    // ayant des suppressions juste après (faute de mieux).
    if (statuses[lastEqualOrAddIndex] === "unchanged") {
      statuses[lastEqualOrAddIndex] = "deleted-before";
    }
  }

  return statuses;
}

function getStatusesForView(view: EditorView): DiffStatus[] {
  const { baselineLines } = view.state.field(diffState);
  const currentLines = view.state.doc.toString().split(/\r?\n/);
  return computeLineStatuses(baselineLines, currentLines);
}

export function diffGutter(): Extension {
  return [
    diffState,
    gutter({
      class: "cm-diff-gutter",
      lineMarker(view, line) {
        const statuses = getStatusesForView(view);
        const lineNum = view.state.doc.lineAt(line.from).number; // 1-based
        const status = statuses[lineNum - 1];
        switch (status) {
          case "added":
            return addedMarker;
          case "modified":
            return modifiedMarker;
          case "deleted-before":
            return deletedBeforeMarker;
          default:
            return null;
        }
      },
      initialSpacer: () => addedMarker,
    }),
    EditorView.baseTheme({
      ".cm-diff-gutter": {
        width: "4px",
        padding: "0",
      },
      ".cm-diff-gutter .cm-gutterElement": {
        padding: "0",
      },
      ".cm-diff-marker": {
        width: "3px",
        height: "100%",
        minHeight: "1em",
        marginLeft: "1px",
      },
      ".cm-diff-added": {
        backgroundColor: "#3fb950",
      },
      ".cm-diff-modified": {
        backgroundColor: "#d29922",
      },
      ".cm-diff-deleted-before": {
        background:
          "linear-gradient(to bottom, #f85149 0, #f85149 3px, transparent 3px)",
      },
    }),
  ];
}

/** Met à jour la baseline du diff (ex. au save ou à l'ouverture). */
export function setDiffBaseline(view: EditorView, baseline: string): void {
  view.dispatch({ effects: setDiffBaselineEffect.of(baseline) });
}
