import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
} from "@codemirror/language";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";

import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { cpp } from "@codemirror/lang-cpp";

import { smoothCaret } from "../../cursor/cursorlayer";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useUserSettings } from "../../context/UserSettingsContext";
import Welcome from "../Welcome/Welcome";
import "./EditorArea.css";


function getLanguageExtension(lang: string) {
  switch (lang) {
    case "ts":
    case "tsx":
    case "typescript":
      return javascript({ typescript: true, jsx: true });
    case "js":
    case "jsx":
    case "javascript":
      return javascript({ jsx: true });
    case "html":
      return html();
    case "css":
      return cssLang();
    case "json":
      return json();
    case "py":
    case "python":
      return python();
    case "rs":
    case "rust":
      return rust();
    case "cpp":
    case "c":
    case "h":
    case "hpp":
      return cpp();
    default:
      return javascript({ typescript: true, jsx: true });
  }
}

function buildHighlightStyle() {
  const css = (v: string, fb: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

  return HighlightStyle.define([
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: css("--syn-com", "#5c6370"), fontStyle: "italic" },
    { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.modifier, t.operatorKeyword], color: css("--syn-kw", "#c792ea"), fontStyle: "italic" },
    { tag: [t.string, t.special(t.string), t.character], color: css("--syn-str", "#c3e88d") },
    { tag: [t.number, t.integer, t.float, t.bool, t.null], color: css("--syn-num", "#f78c6c") },
    { tag: [t.typeName, t.standard(t.typeName), t.className, t.definition(t.className)], color: css("--syn-type", "#ffcb6b") },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: css("--syn-fn", "#82aaff") },
    { tag: [t.propertyName, t.definition(t.propertyName), t.attributeName], color: css("--syn-prop", "#89ddff") },
    { tag: [t.tagName, t.angleBracket], color: css("--syn-tag", "#f07178") },
    { tag: [t.variableName, t.definition(t.variableName)], color: css("--text-1", "#e6e8ee") },
    { tag: [t.constant(t.variableName), t.constant(t.propertyName)], color: css("--accent-2", "#5ad1ff") },
    { tag: [t.operator, t.punctuation, t.separator, t.bracket, t.brace, t.paren], color: css("--syn-punct", "#b6bcc8") },
    { tag: [t.regexp], color: css("--syn-str", "#c3e88d") },
    { tag: [t.escape], color: css("--accent-2", "#5ad1ff") },
    { tag: [t.meta, t.processingInstruction], color: css("--syn-kw", "#c792ea") },
    { tag: [t.heading], color: css("--syn-fn", "#82aaff"), fontWeight: "bold" },
    { tag: [t.emphasis], fontStyle: "italic" },
    { tag: [t.strong], fontWeight: "bold" },
    { tag: [t.link, t.url], color: css("--accent-2", "#5ad1ff"), textDecoration: "underline" },
  ]);
}

function buildEditorTheme(opts: { fontSize: number; fontFamily: string }) {
  const css = (v: string, fb: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

  return EditorView.theme(
    {
      "&": {
        height: "100%",
        fontSize: `${opts.fontSize}px`,
        backgroundColor: css("--bg-3", "#1e232c"),
        color: css("--text-1", "#e6e8ee"),
      },
      ".cm-scroller": {
        fontFamily: opts.fontFamily,
        lineHeight: "1.55",
        overflow: "auto",
      },
      ".cm-content": {
        caretColor: "transparent",
        padding: "8px 0",
      },
      ".cm-cursor, .cm-dropCursor": { display: "none !important" },

      ".cm-gutters": {
        backgroundColor: css("--bg-3", "#1e232c"),
        color: css("--text-4", "#545b69"),
        border: "none",
        borderRight: `1px solid ${css("--border-1", "#232934")}`,
        userSelect: "none",
      },
      ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 12px 0 16px",
        minWidth: "44px",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: css("--text-1", "#e6e8ee"),
        fontWeight: "600",
      },
      ".cm-foldGutter .cm-gutterElement": {
        color: css("--text-4", "#545b69"),
        cursor: "pointer",
      },
      ".cm-foldGutter .cm-gutterElement:hover": {
        color: css("--text-2", "#b6bcc8"),
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(124, 92, 255, 0.07)",
      },
      ".cm-selectionBackground, ::selection": {
        backgroundColor: "rgba(124, 92, 255, 0.28) !important",
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(124, 92, 255, 0.32) !important",
      },
      ".cm-selectionMatch": {
        backgroundColor: "rgba(90, 209, 255, 0.18)",
        outline: "1px solid rgba(90, 209, 255, 0.35)",
      },
      ".cm-matchingBracket": {
        backgroundColor: "rgba(124, 92, 255, 0.20)",
        outline: `1px solid ${css("--accent", "#7c5cff")}`,
      },
      ".cm-nonmatchingBracket": {
        backgroundColor: "rgba(242, 95, 92, 0.20)",
        outline: `1px solid ${css("--danger", "#f25f5c")}`,
      },
      ".cm-searchMatch": {
        backgroundColor: "rgba(245, 177, 76, 0.25)",
        outline: `1px solid ${css("--warn", "#f5b14c")}`,
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "rgba(245, 177, 76, 0.55)",
      },
      ".cm-panels": {
        backgroundColor: css("--bg-2", "#181c23"),
        color: css("--text-1", "#e6e8ee"),
        borderTop: `1px solid ${css("--border-1", "#232934")}`,
      },
      ".cm-panels input, .cm-panels button": {
        backgroundColor: css("--bg-3", "#1e232c"),
        color: css("--text-1", "#e6e8ee"),
        border: `1px solid ${css("--border-2", "#2d3340")}`,
        borderRadius: "4px",
        padding: "2px 6px",
      },
      ".cm-tooltip": {
        backgroundColor: css("--bg-2", "#181c23"),
        color: css("--text-1", "#e6e8ee"),
        border: `1px solid ${css("--border-2", "#2d3340")}`,
        borderRadius: "6px",
        boxShadow: css("--shadow-1", "0 4px 16px rgba(0,0,0,.35)"),
      },
      ".cm-tooltip-autocomplete": {
        fontFamily: css("--font-mono", "JetBrains Mono, monospace"),
      },
      ".cm-tooltip-autocomplete ul li": {
        padding: "3px 8px",
        color: css("--text-2", "#b6bcc8"),
      },
      ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: "rgba(124, 92, 255, 0.22)",
        color: css("--text-1", "#e6e8ee"),
      },
      ".cm-completionMatchedText": {
        color: css("--accent-2", "#5ad1ff"),
        textDecoration: "none",
        fontWeight: "600",
      },
      ".cm-foldPlaceholder": {
        backgroundColor: "rgba(124, 92, 255, 0.12)",
        color: css("--text-2", "#b6bcc8"),
        border: `1px solid ${css("--border-2", "#2d3340")}`,
        borderRadius: "3px",
        padding: "0 6px",
        margin: "0 2px",
      },
    },
    { dark: true }
  );
}

interface EditorAreaProps {
  /** Optional override — when provided, the editor ignores the workspace context. */
  value?: string;
  language?: string;
  onChange?: (v: string) => void;
  filePath?: string;
}

export default function EditorArea(props: EditorAreaProps = {}) {
  const ws = useWorkspace();
  const active = ws.activeTab;

  // No file open → render the Welcome page
  if (!active && props.value === undefined) {
    return <Welcome />;
  }

  // Bind to the active workspace tab unless explicit props are passed.
  const language = props.language ?? active?.language ?? "tsx";
  const filePath = props.filePath ?? active?.path ?? "untitled";
  const value = props.value ?? active?.content ?? "";
  const onChange =
    props.onChange ??
    ((v: string) => {
      if (active) ws.updateContent(active.id, v);
    });

  return (
    <EditorPane
      key={active?.id ?? "external"}
      value={value}
      language={language}
      filePath={filePath}
      isDirty={!!active?.dirty}
      tabId={active?.id ?? null}
      onChange={onChange}
    />
  );
}

interface EditorPaneProps {
  value: string;
  language: string;
  filePath: string;
  isDirty: boolean;
  tabId: string | null;
  onChange: (v: string) => void;
}

function EditorPane({ value, language, filePath, isDirty, tabId, onChange }: EditorPaneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const { settings } = useUserSettings();
  const {
    editorFontSize,
    editorFontFamily,
    editorTabSize,
    editorLineNumbers,
    editorWordWrap,
    editorActiveLine,
  } = settings;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Re-create the editor when the language or any rendering-related
  // user setting changes.
  useEffect(() => {
    if (!hostRef.current) return;

    const updateListener = EditorView.updateListener.of((u) => {
      if (u.docChanged) {
        onChangeRef.current?.(u.state.doc.toString());
      }
    });

    const indent = " ".repeat(editorTabSize);
    const extensions = [
      ...(editorLineNumbers ? [lineNumbers()] : []),
      highlightActiveLineGutter(),
      foldGutter(),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      history(),
      indentOnInput(),
      indentUnit.of(indent),
      bracketMatching(),
      closeBrackets(),
      ...(editorActiveLine ? [highlightActiveLine()] : []),
      highlightSelectionMatches(),
      ...(editorWordWrap ? [EditorView.lineWrapping] : []),
      EditorState.allowMultipleSelections.of(true),
      autocompletion({
        activateOnTyping: true,
        maxRenderedOptions: 30,
        defaultKeymap: true,
      }),
      keymap.of([
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
      ]),
      getLanguageExtension(language),
      syntaxHighlighting(buildHighlightStyle()),
      buildEditorTheme({ fontSize: editorFontSize, fontFamily: editorFontFamily }),
      smoothCaret,
      updateListener,
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    language,
    editorFontSize,
    editorFontFamily,
    editorTabSize,
    editorLineNumbers,
    editorWordWrap,
    editorActiveLine,
  ]);

  // Sync external value (typing in the tab, switching tabs, etc.)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  /* ------------------------------------------------------------
     Interactive breadcrumbs derived from the active tab's path.
     ------------------------------------------------------------ */
  // Normalise both Windows and POSIX separators
  const segments = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] ?? "untitled";
  const dirs = segments.slice(0, -1);

  const onCrumbClick = (segment: string, idx: number, isFile: boolean) => {
    const subPath = segments.slice(0, idx + 1).join("/");
    window.dispatchEvent(
      new CustomEvent("breadcrumb:click", {
        detail: { segment, path: subPath, isFile, tabId },
      })
    );
    if (isFile) {
      requestAnimationFrame(() => viewRef.current?.focus());
    }
  };

  return (
    <div className="editor">
      <div className="editor__breadcrumbs">
        {dirs.map((d, i) => (
          <span key={`${d}-${i}`} className="editor__bc-group">
            <button
              className="editor__bc-segment"
              onClick={() => onCrumbClick(d, i, false)}
              title={segments.slice(0, i + 1).join("/")}
            >
              {d}
            </button>
            <span className="editor__bc-sep">›</span>
          </span>
        ))}
        <button
          className="editor__bc-segment editor__bc-current"
          onClick={() => onCrumbClick(fileName, segments.length - 1, true)}
          title={`${filePath}${isDirty ? " (unsaved)" : ""}`}
        >
          {fileName}
          {isDirty && <span className="editor__bc-dirty" aria-label="Unsaved" />}
        </button>
      </div>

      <div className="editor__viewport editor__viewport--cm">
        <div ref={hostRef} className="editor__cm-host" />
      </div>
    </div>
  );
}
