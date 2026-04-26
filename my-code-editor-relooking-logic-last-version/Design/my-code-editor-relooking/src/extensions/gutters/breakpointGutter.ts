import { gutter, GutterMarker, EditorView } from "@codemirror/view";
import {
  StateEffect,
  StateField,
  RangeSet,
  type Extension,
} from "@codemirror/state";

/**
 * Gouttière de breakpoints
 * - Clic sur la gouttière : toggle un breakpoint sur la ligne
 * - Les breakpoints sont stockés sous forme de RangeSet<GutterMarker>
 */

class BreakpointMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement("div");
    el.className = "cm-breakpoint-marker";
    el.title = "Breakpoint";
    return el;
  }
}

const breakpointMarker = new BreakpointMarker();

export const toggleBreakpointEffect = StateEffect.define<{ pos: number; on: boolean }>({
  map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on }),
});

export const clearBreakpointsEffect = StateEffect.define<null>();

const breakpointState = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(set, transaction) {
    set = set.map(transaction.changes);
    for (const e of transaction.effects) {
      if (e.is(toggleBreakpointEffect)) {
        if (e.value.on) {
          set = set.update({ add: [breakpointMarker.range(e.value.pos)] });
        } else {
          set = set.update({ filter: (from) => from !== e.value.pos });
        }
      } else if (e.is(clearBreakpointsEffect)) {
        set = RangeSet.empty;
      }
    }
    return set;
  },
});

function toggleBreakpoint(view: EditorView, pos: number) {
  const breakpoints = view.state.field(breakpointState);
  // Snap pos to start of line so two clicks anywhere on the same line
  // toggle the same breakpoint, and clicks on different lines never collide.
  const line = view.state.doc.lineAt(pos);
  const linePos = line.from;
  let hasBreakpoint = false;
  breakpoints.between(linePos, linePos, () => {
    hasBreakpoint = true;
  });
  view.dispatch({
    effects: toggleBreakpointEffect.of({ pos: linePos, on: !hasBreakpoint }),
  });
}

export function breakpointGutter(): Extension {
  return [
    breakpointState,
    gutter({
      class: "cm-breakpoint-gutter",
      markers: (v) => v.state.field(breakpointState),
      initialSpacer: () => breakpointMarker,
      domEventHandlers: {
        mousedown(view, line) {
          toggleBreakpoint(view, line.from);
          return true;
        },
      },
    }),
    EditorView.baseTheme({
      ".cm-breakpoint-gutter": {
        width: "18px",
        cursor: "pointer",
      },
      ".cm-breakpoint-gutter .cm-gutterElement": {
        position: "relative",
        width: "18px",
        height: "100%",
      },
      ".cm-breakpoint-gutter .cm-gutterElement:hover::before": {
        content: '""',
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: "rgba(229, 80, 80, 0.45)",
        pointerEvents: "none",
      },
      ".cm-breakpoint-marker": {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "11px",
        height: "11px",
        borderRadius: "50%",
        backgroundColor: "#e51400",
        boxShadow: "0 0 4px rgba(229, 20, 0, 0.7)",
        pointerEvents: "none",
      },
    }),
  ];
}

/** Récupère les positions (offsets) des lignes ayant un breakpoint */
export function getBreakpoints(view: EditorView): number[] {
  const set = view.state.field(breakpointState, false);
  if (!set) return [];
  const positions: number[] = [];
  const cursor = set.iter();
  while (cursor.value !== null) {
    positions.push(cursor.from);
    cursor.next();
  }
  return positions;
}
