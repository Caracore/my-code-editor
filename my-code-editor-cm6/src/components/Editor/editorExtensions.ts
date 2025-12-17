// editorExtensions.ts
// Ce fichier configure les extensions de base pour l'éditeur CodeMirror 6.
// Ce fichier regroupe toutes les extensions importantes, proprement organisées.
import {
  EditorState,
  Compartment
} from "@codemirror/state";

import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor
} from "@codemirror/view";

import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap
} from "@codemirror/language";

import {
  lineNumbers,
  highlightSpecialChars
} from "@codemirror/view";

import {
  defaultKeymap,
  history,
  historyKeymap
} from "@codemirror/commands";

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap
} from "@codemirror/autocomplete";

import { javascript } from "@codemirror/lang-javascript";

// Compartments for dynamic config (theme, language, readOnly, etc.)
export const language = new Compartment();
export const theme = new Compartment();
export const editable = new Compartment();
export const tabSize = new Compartment();

export function basicExtensions() {
  return [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    foldGutter(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...foldKeymap
    ])
  ];
}

export function createEditorExtensions() {
  return [
    lineNumbers(),
    basicExtensions(),
    language.of(javascript()),
    theme.of(EditorView.theme({}, { dark: true })),
    editable.of(true),
    tabSize.of(EditorState.tabSize.of(2))
  ];
}
