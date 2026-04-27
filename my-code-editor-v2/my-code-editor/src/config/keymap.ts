/**
 * Canonical keymap definitions.
 *
 * Single source of truth for:
 *   - the list of keyboard-bindable actions exposed to the user,
 *   - the human-readable labels shown in the Settings UI,
 *   - the default key combinations.
 *
 * Combos are stored in a normalised lowercase form like:
 *     "ctrl+shift+p"   "ctrl+,"   "ctrl+`"   "f11"
 * Modifiers always appear in this fixed order: ctrl, alt, shift.
 */

export interface KeymapDef {
  /** Stable internal id (also dispatched as `menu-action`). */
  action: string;
  /** Human-readable label shown in the settings UI. */
  label: string;
  /** Default combo, normalised. */
  defaultCombo: string;
  /** Logical group used to render section headers. */
  group: "View" | "File" | "Terminal" | "Window" | "Tools";
}

export const KEYMAP_DEFS: KeymapDef[] = [
  // View / panels
  { action: "view:toggle-sidebar",  label: "Toggle Sidebar",      defaultCombo: "ctrl+b",       group: "View" },
  { action: "view:toggle-right",    label: "Toggle Right Panel",  defaultCombo: "ctrl+alt+b",   group: "View" },
  { action: "view:toggle-bottom",   label: "Toggle Bottom Panel", defaultCombo: "ctrl+j",       group: "View" },
  { action: "view:command-palette", label: "Command Palette",     defaultCombo: "ctrl+shift+p", group: "View" },
  { action: "nav:file",             label: "Go to File",          defaultCombo: "ctrl+p",       group: "View" },
  { action: "view:fullscreen",      label: "Toggle Full Screen",  defaultCombo: "f11",          group: "View" },

  // Terminal
  { action: "tools:terminal",       label: "Focus Terminal",      defaultCombo: "ctrl+`",       group: "Terminal" },
  { action: "terminal:new",         label: "New Terminal",        defaultCombo: "ctrl+shift+`", group: "Terminal" },

  // File
  { action: "file:save",            label: "Save File",           defaultCombo: "ctrl+s",       group: "File" },
  { action: "file:close-editor",    label: "Close Editor",        defaultCombo: "ctrl+w",       group: "File" },
  { action: "file:open-folder",     label: "Open Folder",         defaultCombo: "ctrl+o",       group: "File" },
  { action: "file:new",             label: "New File",            defaultCombo: "ctrl+n",       group: "File" },

  // Window / tools
  { action: "window:reload",        label: "Reload Window",       defaultCombo: "ctrl+r",       group: "Window" },
  { action: "tools:settings",       label: "Open Settings",       defaultCombo: "ctrl+,",       group: "Tools" },
];

/** action -> default combo */
export const DEFAULT_KEYMAP: Record<string, string> = Object.fromEntries(
  KEYMAP_DEFS.map((d) => [d.action, d.defaultCombo]),
);

/**
 * Actions that should still fire while typing inside an editor / terminal /
 * input. Anything else is suppressed inside editable targets so we never
 * steal keystrokes the user expects the editor or shell to handle.
 */
export const ALWAYS_ACTIVE_ACTIONS = new Set<string>([
  "view:toggle-sidebar",
  "view:toggle-right",
  "view:toggle-bottom",
  "tools:terminal",
  "terminal:new",
  "view:command-palette",
  "nav:file",
  "file:save",
  "file:close-editor",
  "window:reload",
  "view:fullscreen",
  "tools:settings",
]);

/* -------------------------------------------------------------- */
/*  Combo helpers                                                  */
/* -------------------------------------------------------------- */

/** Build a normalised "ctrl+shift+x" string from a KeyboardEvent. */
export function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  let k = e.key;
  if (k === " ") k = "space";
  if (k === "Escape") k = "escape";
  if (k.length === 1) k = k.toLowerCase();
  parts.push(k.toLowerCase());
  return parts.join("+");
}

/**
 * Normalise a combo string typed/stored by the user.
 * Accepts "Ctrl+Shift+P", "ctrl + p", "CTRL+,", "F11", …
 */
export function normalizeCombo(input: string): string {
  if (!input) return "";
  const tokens = input
    .split("+")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return "";

  const mods = new Set<string>();
  let key = "";
  for (const t of tokens) {
    if (t === "cmd" || t === "meta" || t === "win" || t === "control") {
      mods.add("ctrl");
    } else if (t === "ctrl" || t === "alt" || t === "shift") {
      mods.add(t);
    } else {
      key = t;
    }
  }
  const parts: string[] = [];
  if (mods.has("ctrl")) parts.push("ctrl");
  if (mods.has("alt")) parts.push("alt");
  if (mods.has("shift")) parts.push("shift");
  if (key) parts.push(key);
  return parts.join("+");
}

/** Pretty-print a normalised combo for display: "ctrl+shift+p" -> "Ctrl+Shift+P". */
export function displayCombo(combo: string): string {
  if (!combo) return "";
  return combo
    .split("+")
    .map((t) => {
      if (t === "ctrl") return "Ctrl";
      if (t === "alt") return "Alt";
      if (t === "shift") return "Shift";
      if (t.length === 1) return t.toUpperCase();
      // Function keys: "f11" -> "F11"
      if (/^f\d{1,2}$/.test(t)) return t.toUpperCase();
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join("+");
}

/** True if a combo only consists of modifiers (incomplete capture). */
export function isModifierOnly(combo: string): boolean {
  if (!combo) return true;
  const parts = combo.split("+");
  return parts.every((p) => p === "ctrl" || p === "alt" || p === "shift");
}
