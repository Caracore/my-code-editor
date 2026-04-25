import { useEffect, useRef, useState } from "react";
import { EditorView, gutter, keymap, lineNumbers } from "@codemirror/view";
import SearchBar, { searchHighlightExtension } from "../SearchBar/SearchBar";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
// import { indentWithTab } from "@codemirror/commands";
import { minimalSetup } from "codemirror";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { autocompletion } from "@codemirror/autocomplete";

// KeyBinding type definition (not exported from @codemirror/view in newer versions)
interface KeyBinding {
  key?: string;
  mac?: string;
  run: (view: EditorView) => boolean;
  preventDefault?: boolean;
}
import { html, htmlCompletionSource } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css"; //, cssCompletionSource
import { javascript } from "@codemirror/lang-javascript"; // , javascriptLanguage
import { jsSmartProvider } from "../../extensions/js/jsProvider";
import { cssSmartProvider } from "../../extensions/css/cssProvider";
import { htmlSnippets } from "../../extensions/html/htmlSnippets";
import { pythonSmartProvider } from "../../extensions/python/pythonProvider";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp"; 
import { rust } from "@codemirror/lang-rust";
import { rustSmartProvider } from "../../extensions/rust/rustProvider";
import { cppSmartProvider } from "../../extensions/cpp/cppProvider";
import { json } from "@codemirror/lang-json";
import { smoothCaret } from "../../cursor/cursorlayer";
import { lspLinter, updateDiagnostics, createLspCompletionProvider, lspInlayHints, createInlayHintsProvider } from "../../extensions/lsp";
import { breakpointGutter, diagnosticsGutter, diffGutter, setDiffBaseline } from "../../extensions/gutters";
import { lspManager } from "../../lsp";
import type { Diagnostic } from "../../lsp";
import { useSettingsContext } from "../../context/SettingsContext";

interface CodeEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  language?: string;
  filePath?: string;
}

export default function CodeEditorCM6({ value, onChange, language = "css", filePath }: CodeEditorProps) { // language = "html"
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const filePathRef = useRef<string | null>(filePath || null);
  const languageRef = useRef<string>(language);
  
  // Get LSP settings
  const { lspEnabled } = useSettingsContext();

  // Update refs when props change
  useEffect(() => {
    filePathRef.current = filePath || null;
    languageRef.current = language;
  }, [filePath, language]);

  // LSP: Determine LSP language from editor language
  const getLspLanguage = (lang: string): string | null => {
    switch (lang) {
      case "py":
      case "python":
        return "python";
      case "rs":
      case "rust":
        return "rust";
      case "ts":
      case "tsx":
      case "typescript":
        return "typescript";
      case "js":
      case "jsx":
      case "javascript":
        return "javascript";
      default:
        return null;
    }
  };

  // LSP: Open document and subscribe to diagnostics
  useEffect(() => {
    if (!filePath || !lspEnabled) return;

    const lspLang = getLspLanguage(language);
    if (!lspLang) return;

    // Open document in LSP
    lspManager.openDocument(filePath, lspLang, value);

    // Subscribe to diagnostics
    const unsubscribe = lspManager.onDiagnostics((diagFilePath: string, diagnostics: Diagnostic[]) => {
      if (diagFilePath === filePath && viewRef.current) {
        updateDiagnostics(viewRef.current, diagnostics);
      }
    });

    return () => {
      unsubscribe();
      if (filePath) {
        lspManager.closeDocument(filePath);
      }
    };
  }, [filePath, language, lspEnabled]);

  // LSP: Update document on content change (debounced)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!filePath || !lspEnabled) return;

    const lspLang = getLspLanguage(language);
    if (!lspLang) return;

    // Debounce updates to LSP
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      lspManager.updateDocument(filePath, value);
    }, 300);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [value, filePath, language, lspEnabled]);

  // Écouter l'événement global pour toggle la recherche
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail === "search:toggle") {
        setIsSearchVisible(prev => !prev);
      }
    };
    window.addEventListener("menu-action", handler as EventListener);
    return () => window.removeEventListener("menu-action", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        onChange(newValue);
      }
    });

    // Détection dynamique du langage et des completion sources
    let languageExtension: ReturnType<typeof html>;
    let completionSources: ((context: import("@codemirror/autocomplete").CompletionContext) => import("@codemirror/autocomplete").CompletionResult | Promise<import("@codemirror/autocomplete").CompletionResult | null> | null)[] = [];
    let useLsp = false;
    let lspLanguage: string | null = null;

    
    if (language === "html") {
      console.log("Detected language:", language);
      languageExtension = html();
      completionSources = [htmlSnippets, htmlCompletionSource];
    } else if (language === "css") {
      console.log("Detected language:", language);
      languageExtension = css();
      completionSources = [cssSmartProvider];
    } else if (language === "js" || language === "jsx" || language === "javascript") {
      console.log("Detected language:", language);
      languageExtension = javascript();
      completionSources = [jsSmartProvider];
      useLsp = true;
      lspLanguage = "javascript";
    } else if (language === "ts" || language === "tsx" || language === "typescript") {
      console.log("Detected language:", language);
      languageExtension = javascript({ typescript: true });
      completionSources = [jsSmartProvider];
      useLsp = true;
      lspLanguage = "typescript";
    } else if (language === "py"|| language === "python") {
      console.log("Detected language:", language);
      languageExtension = python();
      completionSources = [pythonSmartProvider];
      useLsp = true;
      lspLanguage = "python";
    } else if (language === "cpp") {
      console.log("Detected language:", language);
      languageExtension = cpp();
      completionSources = [cppSmartProvider];
    } else if (language === "rs" || language === "rust") {
      console.log("Detected language:", language);
      languageExtension = rust();
      completionSources = [rustSmartProvider];
      useLsp = true;
      lspLanguage = "rust";
    } else if (language === "json") {
      console.log("Detected language:", language);
      languageExtension = json();
      completionSources = [];
    } 
    else {
      // Par défaut, HTML
      languageExtension = html();
      completionSources = [htmlSnippets, htmlCompletionSource];
    }

    // Add LSP completion provider if available and enabled
    if (useLsp && lspLanguage && lspEnabled) {
      const lspCompletionProvider = createLspCompletionProvider(
        lspLanguage,
        () => filePathRef.current
      );
      // Add LSP completions alongside local completions
      completionSources = [...completionSources, lspCompletionProvider];
    }
    
    // Only use LSP if enabled
    const effectiveUseLsp = useLsp && lspEnabled;

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
      // Binding personnalisé pour Tab : insère une vraie tabulation au curseur
      {
        key: "Tab",
        run: (view) => {
          const { state } = view;
          const { from, to } = state.selection.main;
          
          // Si pas de sélection, insérer une tabulation à la position du curseur
          if (from === to) {
            view.dispatch({
              changes: { from, to, insert: "\t" },
              selection: { anchor: from + 1 },
            });
            return true;
          }
          
          // Si sélection, utiliser l'indentation normale
          return false;
        },
      },
      // {
      //   key: "Shift-Tab",
      //   run: indentWithTab.run,
      // },
      // ...defaultKeymap.filter((binding) => {
      //   // Filtrer les raccourcis que nous voulons gérer au niveau global
      //   const key = binding.key;
      //   if (!key) return true;
      //   // Laisser passer Ctrl+S, Ctrl+O, Ctrl+W, Ctrl+N, Ctrl+F
      //   // Les événements copier/coller/couper sont gérés par les event listeners natifs
      //   if (key.includes("Mod-s") || key.includes("Mod-o") || 
      //       key.includes("Mod-w") || key.includes("Mod-n") ||
      //       key.includes("Mod-f")) {
      //     return false;
      //   }
      //   return true;
      // }),
      // ...historyKeymap,
    ];

    const state = EditorState.create({
      doc: value,
      extensions: [
        breakpointGutter(),
        diagnosticsGutter(),
        diffGutter(),
        lineNumbers(), gutter({class: "cm-gutters"}),
        minimalSetup,
        languageExtension,  // Étape 2 : extension de langage dynamique
        smoothCaret,
        history(),
        keymap.of(customKeymap),
        searchHighlightExtension, // Extension de surlignage personnalisé
        updateListener,
        EditorView.lineWrapping,
        syntaxHighlighting(customHighlightStyle),
        // LSP linter for diagnostics (only if LSP is enabled)
        ...(effectiveUseLsp ? [lspLinter()] : []),
        // LSP inlay hints (only if LSP is enabled)
        ...(effectiveUseLsp ? [lspInlayHints(), createInlayHintsProvider(() => filePathRef.current)] : []),
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
          
          // === Curseur natif (visible pour déboguer) ===
          ".cm-cursor, .cm-dropCursor, .cm-secondaryCursor": {   
            // borderLeftWidth: "0px !important",
            display: "none !important",
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

    // Initialiser la baseline du diff gutter avec le contenu initial
    setDiffBaseline(view, value);

    // NE PAS ajouter de gestionnaires personnalisés pour copier/coller/couper
    // CodeMirror les gère déjà nativement via minimalSetup
    // Ajouter nos propres handlers cause une duplication

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

  // Focus automatique sur l'éditeur quand un fichier est ouvert
  useEffect(() => {
    if (filePath && viewRef.current) {
      // Réinitialiser la baseline du diff gutter au changement de fichier
      setDiffBaseline(viewRef.current, value);
      // Petit délai pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        viewRef.current?.focus();
      });
    }
  }, [filePath]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <SearchBar
        view={viewRef.current}
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
      />
      <div
        ref={editorRef}
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "#0d0d0d",
          position: "relative",
          overflow: "hidden",
        }}
      />
    </div>
  );

}
