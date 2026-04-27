import { useEffect, useRef, useState } from "react";
import { EditorView, gutter, keymap, lineNumbers } from "@codemirror/view";
import SearchBar, { searchHighlightExtension } from "../SearchBar/SearchBar";
import { EditorState } from "@codemirror/state";
import { history } from "@codemirror/commands";
// defaultKeymap, historyKeymap
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
import { lspManager } from "../../lsp";
import type { Diagnostic } from "../../lsp";
import { useSettingsContext } from "../context/SettingsContext";

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

    // Récupérer une variable CSS calculée (réservé aux usages non-réactifs).
    // NOTE: pour la coloration syntaxique et le thème de l'éditeur, on
    // utilise directement `var(--editor-*)` afin que l'éditeur réagisse
    // automatiquement aux changements de thème.
    const getComputedColor = (varName: string) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    };
    void getComputedColor;

    // Définir le style de coloration syntaxique basé sur les variables CSS
    const customHighlightStyle = HighlightStyle.define([
      { tag: t.comment, color: "var(--editor-comment)" },
      { tag: t.lineComment, color: "var(--editor-comment)" },
      { tag: t.blockComment, color: "var(--editor-comment)" },

      { tag: t.keyword, color: "var(--editor-keyword)" },
      { tag: t.controlKeyword, color: "var(--editor-keyword)" },
      { tag: t.definitionKeyword, color: "var(--editor-keyword)" },
      { tag: t.modifier, color: "var(--editor-keyword)" },

      { tag: t.operator, color: "var(--editor-operator)" },
      { tag: t.punctuation, color: "var(--editor-punctuation)" },
      { tag: t.separator, color: "var(--editor-punctuation)" },

      { tag: t.string, color: "var(--editor-string)" },
      { tag: t.special(t.string), color: "var(--editor-string-special)" },
      { tag: t.character, color: "var(--editor-string)" },

      { tag: t.number, color: "var(--editor-number)" },
      { tag: t.integer, color: "var(--editor-number)" },
      { tag: t.float, color: "var(--editor-number)" },

      { tag: t.bool, color: "var(--editor-boolean)" },
      { tag: t.null, color: "var(--editor-null)" },

      { tag: t.variableName, color: "var(--editor-variable)" },
      { tag: t.definition(t.variableName), color: "var(--editor-variable-definition)" },
      { tag: t.special(t.variableName), color: "var(--editor-variable-special)" },

      { tag: t.propertyName, color: "var(--editor-property)" },
      { tag: t.definition(t.propertyName), color: "var(--editor-property-definition)" },

      { tag: t.function(t.variableName), color: "var(--editor-function)" },
      { tag: t.function(t.propertyName), color: "var(--editor-function)" },

      { tag: t.className, color: "var(--editor-class)" },
      { tag: t.definition(t.className), color: "var(--editor-class-name)" },

      { tag: t.typeName, color: "var(--editor-type)" },
      { tag: t.typeOperator, color: "var(--editor-type)" },
      { tag: t.standard(t.typeName), color: "var(--editor-type-name)" },

      { tag: t.tagName, color: "var(--editor-tag)" },
      { tag: t.angleBracket, color: "var(--editor-tag)" },

      { tag: t.attributeName, color: "var(--editor-attribute)" },
      { tag: t.attributeValue, color: "var(--editor-attribute-value)" },

      { tag: t.constant(t.variableName), color: "var(--editor-constant)" },
      { tag: t.constant(t.propertyName), color: "var(--editor-constant)" },

      { tag: t.regexp, color: "var(--editor-regexp)" },
      { tag: t.escape, color: "var(--editor-escape)" },

      { tag: t.meta, color: "var(--editor-meta)" },
      { tag: t.processingInstruction, color: "var(--editor-meta)" },

      { tag: t.heading, color: "var(--editor-heading)", fontWeight: "bold" },
      { tag: t.heading1, color: "var(--editor-heading-1)", fontWeight: "bold" },
      { tag: t.heading2, color: "var(--editor-heading-2)", fontWeight: "bold" },
      { tag: t.heading3, color: "var(--editor-heading-3)", fontWeight: "bold" },

      { tag: t.emphasis, color: "var(--editor-emphasis)", fontStyle: "italic" },
      { tag: t.strong, color: "var(--editor-strong)", fontWeight: "bold" },

      { tag: t.link, color: "var(--editor-link)" },
      { tag: t.url, color: "var(--editor-link-url)" },
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
            backgroundColor: "var(--editor-bg)",
            color: "var(--editor-fg)",
            height: "100%",
          },
          ".cm-content": {
            caretColor: "var(--editor-cursor)",
            fontFamily: "Consolas, 'Courier New', monospace",
          },
          ".cm-scroller": {
            fontFamily: "Consolas, 'Courier New', monospace",
          },

          // === Curseur natif (visible pour déboguer) ===
          ".cm-cursor, .cm-dropCursor, .cm-secondaryCursor": {
            display: "none !important",
          },
          // === Sélection ===
          ".cm-selectionBackground, ::selection": {
            backgroundColor: "var(--editor-selection-bg)",
          },
          "&.cm-focused .cm-selectionBackground, &.cm-focused ::selection": {
            backgroundColor: "var(--editor-selection-main-bg)",
          },
          ".cm-selectionMatch": {
            backgroundColor: "var(--editor-selection-match-bg)",
          },

          // === Ligne active ===
          ".cm-activeLine": {
            backgroundColor: "var(--editor-active-line-bg)",
          },

          // === Gouttières (gutters) ===
          ".cm-gutters": {
            backgroundColor: "var(--editor-gutter-bg)",
            color: "var(--editor-line-number-fg)",
            border: "none",
            borderRight: "1px solid var(--editor-gutter-border)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "var(--editor-active-line-gutter-bg)",
            color: "var(--editor-line-number-active-fg)",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            color: "var(--editor-line-number-fg)",
          },
          ".cm-gutter:hover": {
            backgroundColor: "var(--editor-gutter-hover-bg)",
          },

          // === Pliage de code (folding) ===
          ".cm-foldPlaceholder": {
            backgroundColor: "var(--editor-fold-placeholder-bg)",
            color: "var(--editor-fold-placeholder-fg)",
            border: "none",
            padding: "0 4px",
          },
          ".cm-foldGutter .cm-gutterElement": {
            color: "var(--editor-fold-gutter-fg)",
          },
          ".cm-foldGutter .cm-gutterElement:hover": {
            color: "var(--editor-fold-gutter-hover-fg)",
          },

          // === Correspondances de crochets ===
          ".cm-matchingBracket, .cm-nonmatchingBracket": {
            backgroundColor: "var(--editor-matching-bracket-bg)",
            border: "1px solid var(--editor-matching-bracket-border)",
          },
          ".cm-nonmatchingBracket": {
            backgroundColor: "var(--editor-nonmatching-bracket-bg)",
            border: "1px solid var(--editor-nonmatching-bracket-border)",
          },

          // === Résultats de recherche ===
          ".cm-searchMatch": {
            backgroundColor: "var(--editor-search-match-bg)",
          },
          ".cm-searchMatch.cm-searchMatch-selected": {
            backgroundColor: "var(--editor-search-match-selected-bg)",
          },

          // === Panneaux ===
          ".cm-panel": {
            backgroundColor: "var(--editor-panel-bg)",
            color: "var(--editor-panel-fg)",
            borderTop: "1px solid var(--editor-panel-border)",
          },
          ".cm-panel.cm-panel-lint ul": {
            backgroundColor: "var(--editor-panel-bg)",
          },

          // === Diagnostic / Lint ===
          ".cm-diagnostic": {
            padding: "3px 6px 3px 8px",
            marginLeft: "-1px",
            display: "block",
          },
          ".cm-diagnostic-error": {
            borderLeft: "3px solid var(--editor-error-border)",
            backgroundColor: "var(--editor-error-bg)",
          },
          ".cm-diagnostic-warning": {
            borderLeft: "3px solid var(--editor-warning-border)",
            backgroundColor: "var(--editor-warning-bg)",
          },
          ".cm-diagnostic-info": {
            borderLeft: "3px solid var(--editor-info-border)",
            backgroundColor: "var(--editor-info-bg)",
          },
          ".cm-diagnostic-hint": {
            borderLeft: "3px solid var(--editor-hint-border)",
            backgroundColor: "var(--editor-hint-bg)",
          },

          // === Tooltip générique ===
          ".cm-tooltip": {
            backgroundColor: "var(--editor-tooltip-bg)",
            color: "var(--editor-tooltip-fg)",
            border: "1px solid var(--editor-tooltip-border)",
            borderRadius: "3px",
          },
          ".cm-tooltip code": {
            backgroundColor: "var(--editor-tooltip-code-bg)",
          },

          // === Autocomplétion ===
          ".cm-tooltip-autocomplete": {
            backgroundColor: "var(--editor-autocomplete-bg)",
            border: "1px solid var(--editor-autocomplete-border)",
          },
          ".cm-tooltip-autocomplete ul li[aria-selected]": {
            backgroundColor: "var(--editor-autocomplete-selected-bg)",
            color: "var(--editor-autocomplete-selected-fg)",
          },
          ".cm-tooltip-autocomplete ul li": {
            color: "var(--editor-autocomplete-fg)",
          },
          ".cm-completionMatchedText": {
            color: "var(--editor-autocomplete-match-fg)",
            fontWeight: "bold",
          },
          ".cm-completionIcon": {
            color: "var(--editor-autocomplete-icon-fg)",
          },

          // === Scrollbar ===
          ".cm-scroller::-webkit-scrollbar": {
            width: "12px",
            height: "12px",
          },
          ".cm-scroller::-webkit-scrollbar-thumb": {
            backgroundColor: "var(--editor-scrollbar-bg)",
            borderRadius: "6px",
          },
          ".cm-scroller::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "var(--editor-scrollbar-hover-bg)",
          },
          ".cm-scroller::-webkit-scrollbar-thumb:active": {
            backgroundColor: "var(--editor-scrollbar-active-bg)",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

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
          backgroundColor: "var(--editor-bg)",
          position: "relative",
          overflow: "hidden",
        }}
      />
    </div>
  );

}
