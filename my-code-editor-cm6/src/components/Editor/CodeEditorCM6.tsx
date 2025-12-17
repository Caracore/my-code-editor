import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import type { KeyBinding } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function CodeEditorCM6({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        onChange(newValue);
      }
    });

    // Keymap personnalisé qui laisse passer certains raccourcis vers le système
    const customKeymap: KeyBinding[] = [
      indentWithTab,
      ...defaultKeymap.filter((binding) => {
        // Filtrer les raccourcis que nous voulons gérer au niveau global
        const key = binding.key;
        if (!key) return true;
        // Laisser passer Ctrl+S, Ctrl+O, Ctrl+W, etc.
        if (key.includes("Mod-s") || key.includes("Mod-o") || 
            key.includes("Mod-w") || key.includes("Mod-n") ||
            key.includes("Mod-Shift")) {
          return false; // Ne pas intercepter ces raccourcis
        }
        return true;
      }),
      ...historyKeymap,
    ];

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        html(),
        css(),
        javascript(),
        oneDark,
        history(),
        keymap.of(customKeymap),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
  "&": {
    fontSize: "13px",
    backgroundColor: "#0d0d0d",
    color: "#e0e0e0",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#3a3f58 !important", // ✅ couleur de sélection
  },
  ".cm-content": {
    caretColor: "#ffffff",
  },
}),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
  <div
    ref={editorRef}
    style={{
      height: "100%",
      width: "100%",
      backgroundColor: "#0d0d0d",
    }}
  />
);

}
