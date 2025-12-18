import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
// import { html } from "@codemirror/lang-html";
// import { css } from "@codemirror/lang-css";
// import { javascript } from "@codemirror/lang-javascript";
import { indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import type { KeyBinding } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { autocompletion } from "@codemirror/autocomplete";
// import { detectLanguageFromFilename } from "../utils/detectLanguage";
import { html, htmlCompletionSource } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css"; //, cssCompletionSource
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { cssSmartProvider } from "../../extensions/css/cssProvider";
import { htmlSnippets } from "../../extensions/html/htmlSnippets";

interface CodeEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  language?: "html" | "css" | "js";
}

export default function CodeEditorCM6({ value, onChange, language = "css" }: CodeEditorProps) { // language = "html"
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

    // Détection dynamique du langage et des completion sources
    let languageExtension: any;
    let completionSources: any[] = [];

    if (language === "html") {
      languageExtension = html();
      completionSources = [htmlSnippets, htmlCompletionSource];
    } else if (language === "css") {
      languageExtension = css();
      completionSources = [cssSmartProvider];

    } else if (language === "js") {
      languageExtension = javascript();
      completionSources = [javascriptLanguage]; // Ajoute tes providers JS ici si nécessaire
    } else {
      // Par défaut, HTML
      languageExtension = html();
      completionSources = [htmlSnippets, htmlCompletionSource];
    }

    // Récupérer les couleurs depuis les variables CSS
    const getComputedColor = (varName: string) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    };

    // Définir le style de coloration syntaxique basé sur les variables CSS
    const customHighlightStyle = HighlightStyle.define([
      { tag: t.comment, color: getComputedColor("--editor-comment") || "#6A9955" },
      { tag: t.lineComment, color: getComputedColor("--editor-comment") || "#6A9955" },
      { tag: t.blockComment, color: getComputedColor("--editor-comment") || "#6A9955" },
      
      { tag: t.keyword, color: getComputedColor("--editor-keyword") || "#569CD6" },
      { tag: t.controlKeyword, color: getComputedColor("--editor-keyword") || "#569CD6" },
      { tag: t.definitionKeyword, color: getComputedColor("--editor-keyword") || "#569CD6" },
      { tag: t.modifier, color: getComputedColor("--editor-keyword") || "#569CD6" },
      
      { tag: t.operator, color: getComputedColor("--editor-operator") || "#D4D4D4" },
      { tag: t.punctuation, color: getComputedColor("--editor-punctuation") || "#D4D4D4" },
      { tag: t.separator, color: getComputedColor("--editor-punctuation") || "#D4D4D4" },
      
      { tag: t.string, color: getComputedColor("--editor-string") || "#CE9178" },
      { tag: t.special(t.string), color: getComputedColor("--editor-string-special") || "#D7BA7D" },
      { tag: t.character, color: getComputedColor("--editor-string") || "#CE9178" },
      
      { tag: t.number, color: getComputedColor("--editor-number") || "#B5CEA8" },
      { tag: t.integer, color: getComputedColor("--editor-number") || "#B5CEA8" },
      { tag: t.float, color: getComputedColor("--editor-number") || "#B5CEA8" },
      
      { tag: t.bool, color: getComputedColor("--editor-boolean") || "#569CD6" },
      { tag: t.null, color: getComputedColor("--editor-null") || "#569CD6" },
      
      { tag: t.variableName, color: getComputedColor("--editor-variable") || "#9CDCFE" },
      { tag: t.definition(t.variableName), color: getComputedColor("--editor-variable-definition") || "#9CDCFE" },
      { tag: t.special(t.variableName), color: getComputedColor("--editor-variable-special") || "#4FC1FF" },
      
      { tag: t.propertyName, color: getComputedColor("--editor-property") || "#9CDCFE" },
      { tag: t.definition(t.propertyName), color: getComputedColor("--editor-property-definition") || "#9CDCFE" },
      
      { tag: t.function(t.variableName), color: getComputedColor("--editor-function") || "#DCDCAA" },
      { tag: t.function(t.propertyName), color: getComputedColor("--editor-function") || "#DCDCAA" },
      
      { tag: t.className, color: getComputedColor("--editor-class") || "#4EC9B0" },
      { tag: t.definition(t.className), color: getComputedColor("--editor-class-name") || "#4EC9B0" },
      
      { tag: t.typeName, color: getComputedColor("--editor-type") || "#4EC9B0" },
      { tag: t.typeOperator, color: getComputedColor("--editor-type") || "#4EC9B0" },
      { tag: t.standard(t.typeName), color: getComputedColor("--editor-type-name") || "#4EC9B0" },
      
      { tag: t.tagName, color: getComputedColor("--editor-tag") || "#569CD6" },
      { tag: t.angleBracket, color: getComputedColor("--editor-tag") || "#569CD6" },
      
      { tag: t.attributeName, color: getComputedColor("--editor-attribute") || "#9CDCFE" },
      { tag: t.attributeValue, color: getComputedColor("--editor-attribute-value") || "#CE9178" },
      
      { tag: t.constant(t.variableName), color: getComputedColor("--editor-constant") || "#4FC1FF" },
      { tag: t.constant(t.propertyName), color: getComputedColor("--editor-constant") || "#4FC1FF" },
      
      { tag: t.regexp, color: getComputedColor("--editor-regexp") || "#D16969" },
      { tag: t.escape, color: getComputedColor("--editor-escape") || "#D7BA7D" },
      
      { tag: t.meta, color: getComputedColor("--editor-meta") || "#569CD6" },
      { tag: t.processingInstruction, color: getComputedColor("--editor-meta") || "#569CD6" },
      
      { tag: t.heading, color: getComputedColor("--editor-heading") || "#569CD6", fontWeight: "bold" },
      { tag: t.heading1, color: getComputedColor("--editor-heading-1") || "#569CD6", fontWeight: "bold" },
      { tag: t.heading2, color: getComputedColor("--editor-heading-2") || "#569CD6", fontWeight: "bold" },
      { tag: t.heading3, color: getComputedColor("--editor-heading-3") || "#569CD6", fontWeight: "bold" },
      
      { tag: t.emphasis, color: getComputedColor("--editor-emphasis") || "#D4D4D4", fontStyle: "italic" },
      { tag: t.strong, color: getComputedColor("--editor-strong") || "#D4D4D4", fontWeight: "bold" },
      
      { tag: t.link, color: getComputedColor("--editor-link") || "#4EC9B0" },
      { tag: t.url, color: getComputedColor("--editor-link-url") || "#CE9178" },
    ]);

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
        languageExtension,  // Étape 2 : extension de langage dynamique
        history(),
        keymap.of(customKeymap),
        updateListener,
        EditorView.lineWrapping,
        syntaxHighlighting(customHighlightStyle),
        // Étape 3 : autocomplétion dynamique avec completionSources
        autocompletion({
          override: completionSources,  // Sources dynamiques selon le langage
          activateOnTyping: true,
          maxRenderedOptions: 20,
        }),
        EditorView.theme({
          // === Base de l'éditeur ===
          "&": {
            fontSize: "14px",
            backgroundColor: getComputedColor("--editor-bg") || "#0d0d0d",
            color: getComputedColor("--editor-fg") || "#e0e0e0",
            height: "100%",
          },
          ".cm-content": {
            caretColor: getComputedColor("--editor-cursor") || "#ffffff",
            fontFamily: "Consolas, 'Courier New', monospace",
          },
          ".cm-scroller": {
            fontFamily: "Consolas, 'Courier New', monospace",
          },
          
          // === Curseur ===
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: getComputedColor("--editor-cursor") || "#ffffff",
          },
          
          // === Sélection ===
          ".cm-selectionBackground, ::selection": {
            backgroundColor: getComputedColor("--editor-selection-bg") || "#264F78",
          },
          "&.cm-focused .cm-selectionBackground, &.cm-focused ::selection": {
            backgroundColor: getComputedColor("--editor-selection-main-bg") || getComputedColor("--editor-selection-bg") || "#264F78",
          },
          ".cm-selectionMatch": {
            backgroundColor: getComputedColor("--editor-selection-match-bg") || "#515C6A",
          },
          
          // === Ligne active ===
          ".cm-activeLine": {
            backgroundColor: getComputedColor("--editor-active-line-bg") || "rgba(255, 255, 255, 0.05)",
          },
          
          // === Gouttières (gutters) ===
          ".cm-gutters": {
            backgroundColor: getComputedColor("--editor-gutter-bg") || getComputedColor("--editor-bg") || "#0d0d0d",
            color: getComputedColor("--editor-line-number-fg") || "#858585",
            border: "none",
            borderRight: `1px solid ${getComputedColor("--editor-gutter-border") || "#333333"}`,
          },
          ".cm-activeLineGutter": {
            backgroundColor: getComputedColor("--editor-active-line-gutter-bg") || "rgba(255, 255, 255, 0.05)",
            color: getComputedColor("--editor-line-number-active-fg") || "#C6C6C6",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            color: getComputedColor("--editor-line-number-fg") || "#858585",
          },
          ".cm-gutter:hover": {
            backgroundColor: getComputedColor("--editor-gutter-hover-bg") || "rgba(255, 255, 255, 0.03)",
          },
          
          // === Pliage de code (folding) ===
          ".cm-foldPlaceholder": {
            backgroundColor: getComputedColor("--editor-fold-placeholder-bg") || "rgba(133, 133, 133, 0.1)",
            color: getComputedColor("--editor-fold-placeholder-fg") || "#858585",
            border: "none",
            padding: "0 4px",
          },
          ".cm-foldGutter .cm-gutterElement": {
            color: getComputedColor("--editor-fold-gutter-fg") || "#858585",
          },
          ".cm-foldGutter .cm-gutterElement:hover": {
            color: getComputedColor("--editor-fold-gutter-hover-fg") || "#C6C6C6",
          },
          
          // === Correspondances de crochets ===
          ".cm-matchingBracket, .cm-nonmatchingBracket": {
            backgroundColor: getComputedColor("--editor-matching-bracket-bg") || "rgba(0, 100, 0, 0.3)",
            border: `1px solid ${getComputedColor("--editor-matching-bracket-border") || "#0F0"}`,
          },
          ".cm-nonmatchingBracket": {
            backgroundColor: getComputedColor("--editor-nonmatching-bracket-bg") || "rgba(255, 0, 0, 0.3)",
            border: `1px solid ${getComputedColor("--editor-nonmatching-bracket-border") || "#F00"}`,
          },
          
          // === Résultats de recherche ===
          ".cm-searchMatch": {
            backgroundColor: getComputedColor("--editor-search-match-bg") || "#515C6A",
          },
          ".cm-searchMatch.cm-searchMatch-selected": {
            backgroundColor: getComputedColor("--editor-search-match-selected-bg") || "#6A9955",
          },
          
          // === Panneaux ===
          ".cm-panel": {
            backgroundColor: getComputedColor("--editor-panel-bg") || "#1E1E1E",
            color: getComputedColor("--editor-panel-fg") || "#CCCCCC",
            borderTop: `1px solid ${getComputedColor("--editor-panel-border") || "#3C3C3C"}`,
          },
          ".cm-panel.cm-panel-lint ul": {
            backgroundColor: getComputedColor("--editor-panel-bg") || "#1E1E1E",
          },
          
          // === Diagnostic / Lint ===
          ".cm-diagnostic": {
            padding: "3px 6px 3px 8px",
            marginLeft: "-1px",
            display: "block",
          },
          ".cm-diagnostic-error": {
            borderLeft: `3px solid ${getComputedColor("--editor-error-border") || "#F48771"}`,
            backgroundColor: getComputedColor("--editor-error-bg") || "rgba(244, 135, 113, 0.1)",
          },
          ".cm-diagnostic-warning": {
            borderLeft: `3px solid ${getComputedColor("--editor-warning-border") || "#CCA700"}`,
            backgroundColor: getComputedColor("--editor-warning-bg") || "rgba(204, 167, 0, 0.1)",
          },
          ".cm-diagnostic-info": {
            borderLeft: `3px solid ${getComputedColor("--editor-info-border") || "#4FC1FF"}`,
            backgroundColor: getComputedColor("--editor-info-bg") || "rgba(79, 193, 255, 0.1)",
          },
          ".cm-diagnostic-hint": {
            borderLeft: `3px solid ${getComputedColor("--editor-hint-border") || "#858585"}`,
            backgroundColor: getComputedColor("--editor-hint-bg") || "rgba(133, 133, 133, 0.1)",
          },
          
          // === Tooltip générique ===
          ".cm-tooltip": {
            backgroundColor: getComputedColor("--editor-tooltip-bg") || "#252526",
            color: getComputedColor("--editor-tooltip-fg") || "#CCCCCC",
            border: `1px solid ${getComputedColor("--editor-tooltip-border") || "#454545"}`,
            borderRadius: "3px",
          },
          ".cm-tooltip code": {
            backgroundColor: getComputedColor("--editor-tooltip-code-bg") || "#1E1E1E",
          },
          
          // === Autocomplétion ===
          ".cm-tooltip-autocomplete": {
            backgroundColor: getComputedColor("--editor-autocomplete-bg") || "#252526",
            border: `1px solid ${getComputedColor("--editor-autocomplete-border") || "#454545"}`,
          },
          ".cm-tooltip-autocomplete ul li[aria-selected]": {
            backgroundColor: getComputedColor("--editor-autocomplete-selected-bg") || "#094771",
            color: getComputedColor("--editor-autocomplete-selected-fg") || "#FFFFFF",
          },
          ".cm-tooltip-autocomplete ul li": {
            color: getComputedColor("--editor-autocomplete-fg") || "#CCCCCC",
          },
          ".cm-completionMatchedText": {
            color: getComputedColor("--editor-autocomplete-match-fg") || "#4EC9B0",
            fontWeight: "bold",
          },
          ".cm-completionIcon": {
            color: getComputedColor("--editor-autocomplete-icon-fg") || "#C5C5C5",
          },
          
          // === Scrollbar ===
          ".cm-scroller::-webkit-scrollbar": {
            width: "12px",
            height: "12px",
          },
          ".cm-scroller::-webkit-scrollbar-thumb": {
            backgroundColor: getComputedColor("--editor-scrollbar-bg") || "rgba(121, 121, 121, 0.4)",
            borderRadius: "6px",
          },
          ".cm-scroller::-webkit-scrollbar-thumb:hover": {
            backgroundColor: getComputedColor("--editor-scrollbar-hover-bg") || "rgba(100, 100, 100, 0.7)",
          },
          ".cm-scroller::-webkit-scrollbar-thumb:active": {
            backgroundColor: getComputedColor("--editor-scrollbar-active-bg") || "rgba(191, 191, 191, 0.4)",
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
