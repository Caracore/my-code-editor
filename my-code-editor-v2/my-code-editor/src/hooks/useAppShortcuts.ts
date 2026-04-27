import { useEffect, useRef } from "react";
import {
  ALWAYS_ACTIVE_ACTIONS,
  DEFAULT_KEYMAP,
  comboFromEvent,
  normalizeCombo,
} from "../config/keymap";

const STORAGE_KEY = "my-code-editor:user-settings:v1";

/**
 * Read the active keymap from persisted user settings. Falls back to the
 * defaults so the IDE always has working shortcuts, even before the React
 * tree mounts.
 */
function loadKeymap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_KEYMAP };
    const parsed = JSON.parse(raw);
    const km = parsed?.keymap;
    if (km && typeof km === "object") {
      const out: Record<string, string> = { ...DEFAULT_KEYMAP };
      for (const [action, combo] of Object.entries(km)) {
        if (typeof combo === "string" && combo.trim()) {
          out[action] = normalizeCombo(combo);
        }
      }
      return out;
    }
  } catch {
    /* fall through */
  }
  return { ...DEFAULT_KEYMAP };
}

/** Build the reverse map combo -> action from a forward keymap. */
function buildComboMap(keymap: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [action, combo] of Object.entries(keymap)) {
    if (combo) out[combo] = action;
  }
  return out;
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
 * Wires up real keyboard shortcuts and routes them through the same
 * `menu-action` event bus the dropdown menus use, with a per-action
 * handler map for purely UI-side actions (panel visibility, …).
 *
 * The combo->action mapping is read from the user keymap stored in
 * settings, so users can rebind any action from the Settings UI and
 * the change applies live (via the `user-settings:changed` event).
 */
export function useAppShortcuts(handlers: Record<string, () => void>) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    let comboMap = buildComboMap(loadKeymap());

    const refreshKeymap = () => {
      comboMap = buildComboMap(loadKeymap());
    };

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
        const action = comboMap[chord];
        cancelChord();
        if (action) {
          if (isEditableTarget(e.target) && !ALWAYS_ACTIVE_ACTIONS.has(action)) return;
          fire(action, e);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !e.shiftKey && !e.altKey) {
        chordActive = true;
        chordTimer = window.setTimeout(cancelChord, 900);
        return;
      }

      const action = comboMap[combo];
      if (!action) return;
      if (isEditableTarget(e.target) && !ALWAYS_ACTIVE_ACTIONS.has(action)) return;
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
    window.addEventListener("user-settings:changed", refreshKeymap);
    // Cross-tab sync (rare but cheap to support).
    window.addEventListener("storage", refreshKeymap);
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true } as any);
      window.removeEventListener("menu-action", onMenuAction as EventListener);
      window.removeEventListener("user-settings:changed", refreshKeymap);
      window.removeEventListener("storage", refreshKeymap);
      cancelChord();
    };
  }, []);
}
