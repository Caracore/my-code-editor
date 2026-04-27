/**
 * A Theme is a flat map of CSS variables applied to `:root`.
 * The set of recognised variables mirrors the ones declared in
 * `src/styles/theme.css`. Anything not in the manifest falls back
 * to the corresponding default already on `:root`.
 */
export interface ThemeManifest {
  id: string;
  name: string;
  type: "dark" | "light";
  description?: string;
  author?: string;
  /** Whether the theme came from the bundled set or the user's disk. */
  source?: "builtin" | "user";
  /** CSS custom-property name → value (e.g. "--bg-1": "#101218"). */
  variables: Record<string, string>;
}

/** Variables we are willing to accept from a theme file. Acts as a whitelist. */
export const THEMEABLE_VARS = [
  // Surfaces
  "--bg-0", "--bg-1", "--bg-2", "--bg-3", "--bg-4", "--bg-5",
  "--border-1", "--border-2",
  "--text-1", "--text-2", "--text-3", "--text-4",
  // Accents
  "--accent", "--accent-2", "--accent-soft",
  "--accent-glow-soft", "--accent-glow-strong", "--accent-2-soft",
  "--shadow-accent",
  "--on-accent", "--on-accent-soft",
  // Semantics
  "--success", "--warn", "--danger", "--danger-strong", "--info",
  // Syntax
  "--syn-kw", "--syn-fn", "--syn-str", "--syn-num", "--syn-com",
  "--syn-type", "--syn-prop", "--syn-tag", "--syn-punct",
  // Chrome
  "--overlay-bg",
  "--scrollbar-thumb", "--scrollbar-thumb-hover",
  "--titlebar-bg-from", "--titlebar-bg-to",
  "--statusbar-bg-from", "--statusbar-bg-to",
  "--code-on-light",
  // Editor (CodeMirror 6) — surfaces
  "--editor-bg", "--editor-fg", "--editor-cursor",
  "--editor-selection-bg", "--editor-selection-main-bg", "--editor-selection-match-bg",
  "--editor-active-line-bg",
  // Editor — gutter
  "--editor-gutter-bg", "--editor-gutter-border", "--editor-gutter-hover-bg",
  "--editor-line-number-fg", "--editor-line-number-active-fg",
  "--editor-active-line-gutter-bg",
  // Editor — folding
  "--editor-fold-placeholder-bg", "--editor-fold-placeholder-fg",
  "--editor-fold-gutter-fg", "--editor-fold-gutter-hover-fg",
  // Editor — brackets
  "--editor-matching-bracket-bg", "--editor-matching-bracket-border",
  "--editor-nonmatching-bracket-bg", "--editor-nonmatching-bracket-border",
  // Editor — search
  "--editor-search-match-bg", "--editor-search-match-selected-bg",
  // Editor — panels & diagnostics
  "--editor-panel-bg", "--editor-panel-fg", "--editor-panel-border",
  "--editor-error-border", "--editor-error-bg",
  "--editor-warning-border", "--editor-warning-bg",
  "--editor-info-border", "--editor-info-bg",
  "--editor-hint-border", "--editor-hint-bg",
  // Editor — tooltips & autocomplete
  "--editor-tooltip-bg", "--editor-tooltip-fg",
  "--editor-tooltip-border", "--editor-tooltip-code-bg",
  "--editor-autocomplete-bg", "--editor-autocomplete-border",
  "--editor-autocomplete-fg",
  "--editor-autocomplete-selected-bg", "--editor-autocomplete-selected-fg",
  "--editor-autocomplete-match-fg", "--editor-autocomplete-icon-fg",
  // Editor — scrollbar
  "--editor-scrollbar-bg", "--editor-scrollbar-hover-bg", "--editor-scrollbar-active-bg",
  // Editor — syntax (override the Lezer tag → colour map)
  "--editor-comment", "--editor-keyword",
  "--editor-operator", "--editor-punctuation",
  "--editor-string", "--editor-string-special",
  "--editor-number", "--editor-boolean", "--editor-null",
  "--editor-variable", "--editor-variable-definition", "--editor-variable-special",
  "--editor-property", "--editor-property-definition",
  "--editor-function",
  "--editor-class", "--editor-class-name",
  "--editor-type", "--editor-type-name",
  "--editor-tag",
  "--editor-attribute", "--editor-attribute-value",
  "--editor-constant", "--editor-regexp", "--editor-escape", "--editor-meta",
  "--editor-heading", "--editor-heading-1", "--editor-heading-2", "--editor-heading-3",
  "--editor-emphasis", "--editor-strong",
  "--editor-link", "--editor-link-url",
  // Terminal (xterm.js)
  "--terminal-bg", "--terminal-fg",
  "--terminal-cursor", "--terminal-cursor-accent", "--terminal-selection-bg",
  "--terminal-black", "--terminal-red", "--terminal-green", "--terminal-yellow",
  "--terminal-blue", "--terminal-magenta", "--terminal-cyan", "--terminal-white",
  "--terminal-bright-black", "--terminal-bright-red",
  "--terminal-bright-green", "--terminal-bright-yellow",
  "--terminal-bright-blue", "--terminal-bright-magenta",
  "--terminal-bright-cyan", "--terminal-bright-white",
] as const;

export type ThemeableVar = (typeof THEMEABLE_VARS)[number];
