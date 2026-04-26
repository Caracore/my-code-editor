import { useEffect, useRef } from "react";

/**
 * Normalised keyboard combo -> menu action id.
 * Action ids match those used in `src/config/menuConfig.ts` so menu clicks
 * and keyboard shortcuts go through exactly the same code path.
 */
const COMBOS: Record<string, string> = {
  // View / panels
  "ctrl+b":              "view:toggle-sidebar",
  "ctrl+alt+b":          "view:toggle-right",
  "ctrl+j":              "view:toggle-bottom",
  "ctrl+`":              "tools:terminal",
  "ctrl+shift+`":        "terminal:new",
  "ctrl+shift+p":        "view:command-palette",
  "ctrl+p":              "nav:file",
  "f11":                 "view:fullscreen",

  // File
  "ctrl+s":              "file:save",
  "ctrl+w":              "file:close-editor",
  "ctrl+o":              "file:open-folder",
  "ctrl+k+o":            "file:open-folder", // chord, see below
  "ctrl+n":              "file:new",

  // Window
  "ctrl+r":              "window:reload",
};

/** Build a normalised "ctrl+shift+x" string from a KeyboardEvent. */
function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  let k = e.key;
  if (k === " ") k = "space";
  if (k.length === 1) k = k.toLowerCase();
  parts.push(k.toLowerCase());
  return parts.join("+");
}

/** Returns true if the user is currently typing into a text field. */
function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (el.isContentEditable) return true;
  // CodeMirror's editable area is contentEditable; xterm uses a textarea.
  if (el.closest?.(".cm-content")) return true;
  if (el.closest?.(".xterm")) return true;
  return false;
}

/**
 * Shortcuts that must always fire, even while typing in an editor / terminal.
 * Everything else is suppressed inside editable targets so we never steal
 * keystrokes the user expects the editor or shell to handle.
 */
const ALWAYS_ACTIVE = new Set<string>([
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
]);

/**
 * Wires up real keyboard shortcuts and routes them through the same
 * `menu-action` event bus the dropdown menus use, with a per-action
 * handler map for purely UI-side actions (panel visibility, …).
 */
export function useAppShortcuts(handlers: Record<string, () => void>) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Tracks Ctrl+K chord prefix (e.g. Ctrl+K Ctrl+O = open folder).
    let chordTimer: number | null = null;
    let chordActive = false;
    const cancelChord = () => {
      if (chordTimer != null) {
        window.clearTimeout(chordTimer);
        chordTimer = null;
      }
      chordActive = false;
    };

    const fire = (action: string, e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const local = handlersRef.current[action];
      if (local) {
        local();
      } else {
        window.dispatchEvent(new CustomEvent("menu-action", { detail: action }));
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const combo = comboFromEvent(e);

      // Chord support: Ctrl+K starts a 1s window for follow-up keys.
      if (chordActive) {
        const chord = `ctrl+k+${e.key.toLowerCase()}`;
        const action = COMBOS[chord];
        cancelChord();
        if (action) {
          if (isEditableTarget(e.target) && !ALWAYS_ACTIVE.has(action)) return;
          fire(action, e);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !e.shiftKey && !e.altKey) {
        // Open chord mode (and let CommandPalette also see it for Ctrl+K toggle).
        chordActive = true;
        chordTimer = window.setTimeout(cancelChord, 900);
        return;
      }

      const action = COMBOS[combo];
      if (!action) return;
      if (isEditableTarget(e.target) && !ALWAYS_ACTIVE.has(action)) return;
      fire(action, e);
    };

    // Menu items also dispatch `menu-action` — let local handlers pick up
    // the UI-only ones (toggle-sidebar etc.) regardless of origin.
    const onMenuAction = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      handlersRef.current[action]?.();
    };

    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("menu-action", onMenuAction as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true } as any);
      window.removeEventListener("menu-action", onMenuAction as EventListener);
      cancelChord();
    };
  }, []);
}
