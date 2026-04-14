import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType, keymap } from "@codemirror/view";
import { StateField, StateEffect, RangeSet } from "@codemirror/state";
import type { Extension } from "@codemirror/state";

// KeyBinding type definition (not exported from @codemirror/view in newer versions)
interface KeyBinding {
  key?: string;
  mac?: string;
  run: (view: EditorView) => boolean;
  preventDefault?: boolean;
}

// Characters used for hint labels (easy to type, home row first)
const HINT_CHARS = "asdfghjklqwertyuiopzxcvbnm";

// State for jump mode
interface JumpModeState {
  active: boolean;
  hints: JumpHint[];
  inputBuffer: string;
}

interface JumpHint {
  label: string;
  pos: number;
}

// Effects
const activateJumpMode = StateEffect.define<JumpHint[]>();
const deactivateJumpMode = StateEffect.define<void>();
const updateJumpInput = StateEffect.define<string>();

// Generate hint labels (a, s, d, ... aa, as, ad, ...)
function generateLabels(count: number): string[] {
  const labels: string[] = [];
  const chars = HINT_CHARS;
  
  if (count <= chars.length) {
    for (let i = 0; i < count; i++) {
      labels.push(chars[i]);
    }
  } else {
    for (let i = 0; i < chars.length && labels.length < count; i++) {
      for (let j = 0; j < chars.length && labels.length < count; j++) {
        labels.push(chars[i] + chars[j]);
      }
    }
  }
  
  return labels;
}

// Find jump targets (word starts, symbols, etc.)
function findJumpTargets(view: EditorView): number[] {
  const targets: number[] = [];
  const { from, to } = view.viewport;
  const doc = view.state.doc;
  const text = doc.sliceString(from, to);
  
  // Find word starts and important symbols
  const regex = /\b\w|[(){}\[\]<>.,;:'"=+\-*\/&|!?@#$%^~`]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const pos = from + match.index;
    if (pos >= from && pos < to) {
      targets.push(pos);
    }
  }
  
  return targets;
}

// Hint label widget
class HintLabelWidget extends WidgetType {
  constructor(readonly label: string, readonly isPartialMatch: boolean) {
    super();
  }

  eq(other: HintLabelWidget): boolean {
    return this.label === other.label && this.isPartialMatch === other.isPartialMatch;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cm-jump-hint" + (this.isPartialMatch ? " cm-jump-hint-match" : "");
    span.textContent = this.label.toUpperCase();
    return span;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// State field
const jumpModeField = StateField.define<JumpModeState>({
  create() {
    return { active: false, hints: [], inputBuffer: "" };
  },
  update(state, tr) {
    for (const effect of tr.effects) {
      if (effect.is(activateJumpMode)) {
        return { active: true, hints: effect.value, inputBuffer: "" };
      }
      if (effect.is(deactivateJumpMode)) {
        return { active: false, hints: [], inputBuffer: "" };
      }
      if (effect.is(updateJumpInput)) {
        return { ...state, inputBuffer: effect.value };
      }
    }
    return state;
  },
});

// Build decorations
function buildHintDecorations(view: EditorView, state: JumpModeState): RangeSet<Decoration> {
  if (!state.active) {
    return RangeSet.empty;
  }

  const decorations: { from: number; decoration: Decoration }[] = [];
  
  for (const hint of state.hints) {
    const isMatching = hint.label.startsWith(state.inputBuffer);
    if (!isMatching && state.inputBuffer.length > 0) {
      continue;
    }

    const displayLabel = state.inputBuffer.length > 0 
      ? hint.label.slice(state.inputBuffer.length)
      : hint.label;

    if (displayLabel.length === 0) continue;

    const widget = new HintLabelWidget(displayLabel, state.inputBuffer.length > 0);
    const deco = Decoration.widget({
      widget,
      side: -1,
    });
    
    decorations.push({ from: hint.pos, decoration: deco });
  }

  decorations.sort((a, b) => a.from - b.from);
  return RangeSet.of(decorations.map(d => d.decoration.range(d.from)));
}

// Decoration plugin
const jumpHintDecorations = ViewPlugin.fromClass(
  class {
    decorations: RangeSet<Decoration>;

    constructor(view: EditorView) {
      const state = view.state.field(jumpModeField);
      this.decorations = buildHintDecorations(view, state);
    }

    update(update: ViewUpdate) {
      const state = update.state.field(jumpModeField);
      const prevState = update.startState.field(jumpModeField);
      
      if (state.active !== prevState.active || 
          state.inputBuffer !== prevState.inputBuffer ||
          state.hints !== prevState.hints) {
        this.decorations = buildHintDecorations(update.view, state);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Activate jump mode
function activateJump(view: EditorView): boolean {
  const targets = findJumpTargets(view);
  const labels = generateLabels(targets.length);
  
  const hints: JumpHint[] = targets.map((pos, i) => ({
    label: labels[i],
    pos,
  }));

  view.dispatch({
    effects: activateJumpMode.of(hints),
  });

  return true;
}

// Deactivate jump mode
function deactivateJump(view: EditorView): boolean {
  const state = view.state.field(jumpModeField);
  if (state.active) {
    view.dispatch({
      effects: deactivateJumpMode.of(undefined),
    });
    return true;
  }
  return false;
}

// Handle key input in jump mode
function handleJumpInput(view: EditorView, key: string): boolean {
  const state = view.state.field(jumpModeField);
  if (!state.active) return false;

  if (key === "Escape") {
    return deactivateJump(view);
  }

  if (!HINT_CHARS.includes(key.toLowerCase())) {
    return false;
  }

  const newInput = state.inputBuffer + key.toLowerCase();
  const exactMatch = state.hints.find(h => h.label === newInput);
  
  if (exactMatch) {
    // Jump!
    view.dispatch({
      effects: deactivateJumpMode.of(undefined),
      selection: { anchor: exactMatch.pos },
      scrollIntoView: true,
    });
    view.focus();
    return true;
  }

  const hasMatches = state.hints.some(h => h.label.startsWith(newInput));
  
  if (hasMatches) {
    view.dispatch({
      effects: updateJumpInput.of(newInput),
    });
    return true;
  } else {
    return deactivateJump(view);
  }
}

// Theme
const jumpHintTheme = EditorView.baseTheme({
  ".cm-jump-hint": {
    display: "inline-block",
    padding: "0px 3px",
    marginLeft: "-2px",
    marginRight: "2px",
    borderRadius: "2px",
    backgroundColor: "#FFCC00",
    color: "#000",
    fontWeight: "bold",
    fontSize: "10px",
    fontFamily: "monospace",
    textTransform: "uppercase",
    boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
    zIndex: "1000",
    pointerEvents: "none",
    verticalAlign: "middle",
    lineHeight: "1.2",
  },
  ".cm-jump-hint-match": {
    backgroundColor: "#FF5555",
    color: "#FFF",
  },
});

// DOM event handler for jump mode
const jumpModeHandler = EditorView.domEventHandlers({
  keydown(event, view) {
    const state = view.state.field(jumpModeField);
    if (!state.active) return false;

    if (event.key === "Escape") {
      event.preventDefault();
      return deactivateJump(view);
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      return handleJumpInput(view, event.key);
    }

    if (state.active) {
      event.preventDefault();
      return true;
    }

    return false;
  },
});

// Keymap to activate jump mode (Ctrl+; or Ctrl+')
const jumpModeKeymap: KeyBinding[] = [
  {
    key: "Ctrl-;",
    run: activateJump,
    preventDefault: true,
  },
  {
    key: "Ctrl-'",
    run: activateJump,
    preventDefault: true,
  },
  {
    // Alternative: F key like qutebrowser (when not typing)
    key: "Alt-f",
    run: activateJump,
    preventDefault: true,
  },
];

// Main extension
export function jumpLabels(): Extension {
  return [
    jumpModeField,
    jumpHintDecorations,
    jumpHintTheme,
    jumpModeHandler,
    keymap.of(jumpModeKeymap),
  ];
}

export { activateJump, deactivateJump };
