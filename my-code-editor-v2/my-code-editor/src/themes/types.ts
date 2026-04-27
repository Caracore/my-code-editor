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
  "--bg-0", "--bg-1", "--bg-2", "--bg-3", "--bg-4", "--bg-5",
  "--border-1", "--border-2",
  "--text-1", "--text-2", "--text-3", "--text-4",
  "--accent", "--accent-2", "--accent-soft",
  "--success", "--warn", "--danger", "--info",
  "--syn-kw", "--syn-fn", "--syn-str", "--syn-num", "--syn-com",
  "--syn-type", "--syn-prop", "--syn-tag", "--syn-punct",
] as const;

export type ThemeableVar = (typeof THEMEABLE_VARS)[number];
