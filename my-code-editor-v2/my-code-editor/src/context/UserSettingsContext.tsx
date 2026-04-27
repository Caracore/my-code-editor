import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { DEFAULT_KEYMAP } from "../config/keymap";

/**
 * User preferences for the IDE. Persisted to localStorage so they survive
 * reloads even when the Tauri config layer isn't available.
 */
export interface UserSettings {
  // Editor
  editorFontSize: number;       // 10..22
  editorFontFamily: string;     // CSS font stack
  editorTabSize: number;        // 2 | 4 | 8
  editorLineNumbers: boolean;
  editorWordWrap: boolean;
  editorActiveLine: boolean;
  editorMinimap: boolean;       // future-friendly toggle (stored only)

  // Terminal
  terminalFontSize: number;     // 10..20
  terminalCursorBlink: boolean;

  // Appearance
  accentColor: string;          // hex, drives --accent
  uiDensity: "comfortable" | "compact";

  // Behaviour
  autoSave: boolean;
  confirmOnExit: boolean;
  discordRpc: boolean;
  /** When true, the editor talks to language servers (diagnostics, completion, inlay hints). */
  lspEnabled: boolean;

  // Extensibility
  themeId: string;             // id of the active theme manifest
  enabledPlugins: string[];    // ids of plugins activated at startup

  // Keyboard
  /** action id -> normalised combo (e.g. "view:toggle-sidebar" -> "ctrl+b"). */
  keymap: Record<string, string>;
}

export const DEFAULT_SETTINGS: UserSettings = {
  editorFontSize: 13,
  editorFontFamily:
    '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  editorTabSize: 2,
  editorLineNumbers: true,
  editorWordWrap: true,
  editorActiveLine: true,
  editorMinimap: false,

  terminalFontSize: 13,
  terminalCursorBlink: true,

  accentColor: "#7c5cff",
  uiDensity: "comfortable",

  autoSave: false,
  confirmOnExit: true,
  discordRpc: false,
  lspEnabled: true,

  themeId: "cosmos-dark",
  enabledPlugins: ["builtin.hello-world", "builtin.clock"],

  keymap: { ...DEFAULT_KEYMAP },
};

const STORAGE_KEY = "my-code-editor:user-settings:v1";

interface Ctx {
  settings: UserSettings;
  /** Monotonic counter incremented on every change — useful as a React key. */
  version: number;
  set: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  reset: () => void;
}

const UserSettingsContext = createContext<Ctx | null>(null);

function loadInitial(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const merged: UserSettings = { ...DEFAULT_SETTINGS, ...parsed };
    // Merge keymap so newly-added actions still have defaults even when
    // the persisted file pre-dates them.
    merged.keymap = { ...DEFAULT_KEYMAP, ...(parsed?.keymap ?? {}) };
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyToRoot(s: UserSettings) {
  const root = document.documentElement;
  // Drive the accent + a soft variant for hover/selection backgrounds.
  root.style.setProperty("--accent", s.accentColor);
  // Build a translucent version for `--accent-soft` (rgba with 18% alpha).
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s.accentColor.trim());
  if (m) {
    const [, r, g, b] = m;
    const rr = parseInt(r, 16);
    const gg = parseInt(g, 16);
    const bb = parseInt(b, 16);
    root.style.setProperty("--accent-soft", `rgba(${rr}, ${gg}, ${bb}, 0.18)`);
  }
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadInitial);
  const [version, setVersion] = useState(0);

  // Persist + apply CSS vars on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* quota / private mode — ignore */
    }
    applyToRoot(settings);
    // Notify listeners (useAppShortcuts, plugins) without forcing them
    // to be inside the React tree.
    window.dispatchEvent(
      new CustomEvent("user-settings:changed", { detail: settings }),
    );
  }, [settings]);

  const set = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
      setVersion((v) => v + 1);
    },
    [],
  );

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ settings, version, set, reset }),
    [settings, version, set, reset],
  );

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings(): Ctx {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error("useUserSettings must be used inside <UserSettingsProvider>");
  }
  return ctx;
}
