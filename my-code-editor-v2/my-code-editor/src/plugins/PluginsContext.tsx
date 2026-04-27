import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { PluginManager } from "./PluginManager";
import { BUILTIN_PLUGINS } from "./builtin";
import type { Plugin, PluginCommand, PluginStatusBarItem } from "./types";
import type { Extension } from "@codemirror/state";
import { BUILTIN_THEMES } from "../themes/builtin";
import type { ThemeManifest } from "../themes/types";
import { applyTheme } from "../themes/ThemeManager";
import { loadUserPlugins, loadUserThemes, getExtensionsDir, importExtensionFromDisk } from "./loader";
import { useUserSettings } from "../context/UserSettingsContext";

interface PluginsCtx {
  /** Manager — escape hatch for advanced consumers. */
  manager: PluginManager;
  /** Catalogue of *known* plugins (builtins + loaded from disk). */
  knownPlugins: Plugin[];
  /** Themes catalogue (builtins + loaded from disk). */
  themes: ThemeManifest[];
  activeTheme: ThemeManifest | null;
  setActiveTheme(id: string): void;

  enabledPlugins: Set<string>;
  togglePlugin(id: string, enabled: boolean): Promise<void>;
  isActive(id: string): boolean;

  commands: PluginCommand[];
  statusItemsLeft: PluginStatusBarItem[];
  statusItemsRight: PluginStatusBarItem[];
  editorExtensions: Extension[];

  /** Re-scan the user folder. */
  reload(): Promise<void>;
  /** Open the OS file explorer at the extension folder. */
  openExtensionsDir(kind: "themes" | "plugins"): Promise<void>;
  /**
   * Prompt the user with a file picker to import a theme or plugin and
   * copy it into the extensions folder. Resolves to the destination
   * filename, or `null` if the dialog was cancelled.
   */
  importExtension(kind: "themes" | "plugins"): Promise<string | null>;
}

const PluginsContext = createContext<PluginsCtx | null>(null);

export function PluginsProvider({ children }: { children: ReactNode }) {
  const { settings, set } = useUserSettings();
  const [manager] = useState(() => new PluginManager());
  const [themes, setThemes] = useState<ThemeManifest[]>(BUILTIN_THEMES);
  const [diskPlugins, setDiskPlugins] = useState<Plugin[]>([]);

  // -- Subscribe to manager mutations --------------------------------------
  const rev = useSyncExternalStore(
    useCallback((cb) => manager.subscribe(cb), [manager]),
    () => manager.getRevision(),
    () => 0,
  );

  // -- Bootstrap: register builtins + scan disk ---------------------------
  useEffect(() => {
    for (const p of BUILTIN_PLUGINS) {
      if (!manager.hasPlugin(p.manifest.id)) manager.register(p);
    }
    void reloadDisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  const reloadDisk = useCallback(async () => {
    const [userThemes, userPlugins] = await Promise.all([
      loadUserThemes(),
      loadUserPlugins(),
    ]);
    // Themes: replace user-source ones, keep builtins.
    setThemes([...BUILTIN_THEMES, ...userThemes]);
    // Plugins: drop previously-loaded user plugins, register fresh.
    for (const p of diskPlugins) {
      if (manager.hasPlugin(p.manifest.id)) manager.unregister(p.manifest.id);
    }
    for (const p of userPlugins) manager.register(p);
    setDiskPlugins(userPlugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  // -- Sync enabled plugin set with settings ------------------------------
  useEffect(() => {
    const target = new Set(settings.enabledPlugins);
    void (async () => {
      // Activate those that should be on but aren't.
      for (const id of target) {
        if (manager.hasPlugin(id) && !manager.isActive(id)) {
          try { await manager.activate(id); } catch (e) { console.error(e); }
        }
      }
      // Deactivate those currently on but no longer in the set.
      for (const p of manager.listKnown()) {
        const id = p.manifest.id;
        if (manager.isActive(id) && !target.has(id)) {
          try { await manager.deactivate(id); } catch (e) { console.error(e); }
        }
      }
    })();
    // We deliberately re-run when known plugins change too.
  }, [settings.enabledPlugins, manager, rev]);

  // -- Theme application --------------------------------------------------
  const activeTheme = useMemo(
    () => themes.find((t) => t.id === settings.themeId) ?? themes[0] ?? null,
    [themes, settings.themeId],
  );
  useEffect(() => {
    if (activeTheme) applyTheme(activeTheme);
  }, [activeTheme]);

  // -- Public API ---------------------------------------------------------
  const enabledPlugins = useMemo(
    () => new Set(settings.enabledPlugins),
    [settings.enabledPlugins],
  );

  const togglePlugin = useCallback(
    async (id: string, enabled: boolean) => {
      const next = new Set(settings.enabledPlugins);
      if (enabled) next.add(id);
      else next.delete(id);
      set("enabledPlugins", Array.from(next));
    },
    [settings.enabledPlugins, set],
  );

  const setActiveTheme = useCallback(
    (id: string) => set("themeId", id),
    [set],
  );

  const openExtensionsDir = useCallback(async (kind: "themes" | "plugins") => {
    const dir = await getExtensionsDir(kind);
    if (!dir) return;
    try {
      const opener = await import("@tauri-apps/plugin-opener");
      await opener.openPath(dir);
    } catch (e) {
      console.warn("openPath failed:", e);
    }
  }, []);

  const importExtension = useCallback(
    async (kind: "themes" | "plugins") => {
      const name = await importExtensionFromDisk(kind);
      if (name) await reloadDisk();
      return name;
    },
    [reloadDisk],
  );

  const value = useMemo<PluginsCtx>(
    () => ({
      manager,
      knownPlugins: manager.listKnown(),
      themes,
      activeTheme,
      setActiveTheme,
      enabledPlugins,
      togglePlugin,
      isActive: (id) => manager.isActive(id),
      commands: manager.getCommands(),
      statusItemsLeft: manager.getStatusItems("left"),
      statusItemsRight: manager.getStatusItems("right"),
      editorExtensions: manager.getEditorExtensions(),
      reload: reloadDisk,
      openExtensionsDir,
      importExtension,
    }),
    // rev makes us re-derive whenever the manager mutates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manager, rev, themes, activeTheme, enabledPlugins, togglePlugin, setActiveTheme, reloadDisk, openExtensionsDir, importExtension],
  );

  return (
    <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>
  );
}

export function usePlugins(): PluginsCtx {
  const ctx = useContext(PluginsContext);
  if (!ctx) throw new Error("usePlugins must be used inside <PluginsProvider>");
  return ctx;
}
