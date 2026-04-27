import type { Extension } from "@codemirror/state";
import type {
  Disposable,
  Plugin,
  PluginActivityBarItem,
  PluginAPI,
  PluginCommand,
  PluginStatusBarItem,
} from "./types";

type Listener = () => void;

interface ActivePlugin {
  plugin: Plugin;
  disposables: Disposable[];
  deactivateHooks: Array<() => void>;
}

/**
 * In-memory plugin registry.
 *
 * Plugins register UI affordances through a constrained API; nothing is
 * exposed to filesystem or network. Disabling a plugin fires its
 * `onDeactivate` hooks then drops every registered disposable.
 */
export class PluginManager {
  private known = new Map<string, Plugin>();
  private active = new Map<string, ActivePlugin>();
  private commands = new Map<string, PluginCommand>();
  private statusItems = new Map<string, PluginStatusBarItem>();
  private activityItems = new Map<string, PluginActivityBarItem>();
  private editorExtensions = new Map<string, Extension | (() => Extension)>();
  private listeners = new Set<Listener>();
  /** Bumped whenever the registry changes, so React can subscribe via useSyncExternalStore. */
  private rev = 0;

  // --------------------------- subscription -----------------------------

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  getRevision(): number {
    return this.rev;
  }

  private notify(): void {
    this.rev++;
    for (const l of this.listeners) l();
  }

  // --------------------------- registration -----------------------------

  /** Add a plugin to the catalogue without activating it. */
  register(plugin: Plugin): void {
    this.known.set(plugin.manifest.id, plugin);
    this.notify();
  }

  unregister(id: string): void {
    if (this.active.has(id)) this.deactivate(id);
    this.known.delete(id);
    this.notify();
  }

  hasPlugin(id: string): boolean {
    return this.known.has(id);
  }

  listKnown(): Plugin[] {
    return Array.from(this.known.values());
  }

  isActive(id: string): boolean {
    return this.active.has(id);
  }

  // --------------------------- (de)activation ---------------------------

  async activate(id: string): Promise<void> {
    if (this.active.has(id)) return;
    const plugin = this.known.get(id);
    if (!plugin) throw new Error(`Unknown plugin: ${id}`);
    const slot: ActivePlugin = { plugin, disposables: [], deactivateHooks: [] };
    const api = this.makeApi(id, slot);
    try {
      await plugin.activate(api);
    } catch (e) {
      // Roll back any partial registration.
      slot.disposables.forEach((d) => d.dispose());
      throw e;
    }
    this.active.set(id, slot);
    this.notify();
  }

  async deactivate(id: string): Promise<void> {
    const slot = this.active.get(id);
    if (!slot) return;
    for (const fn of slot.deactivateHooks) {
      try { fn(); } catch (e) { console.error(e); }
    }
    try {
      await slot.plugin.deactivate?.();
    } catch (e) {
      console.error(e);
    }
    for (const d of slot.disposables) {
      try { d.dispose(); } catch (e) { console.error(e); }
    }
    this.active.delete(id);
    this.notify();
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    if (enabled) await this.activate(id);
    else await this.deactivate(id);
  }

  // --------------------------- accessors --------------------------------

  getCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  getStatusItems(align: "left" | "right"): PluginStatusBarItem[] {
    return Array.from(this.statusItems.values())
      .filter((i) => i.align === align)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getActivityItems(): PluginActivityBarItem[] {
    return Array.from(this.activityItems.values());
  }

  getEditorExtensions(): Extension[] {
    const out: Extension[] = [];
    for (const ext of this.editorExtensions.values()) {
      try {
        out.push(typeof ext === "function" ? (ext as () => Extension)() : ext);
      } catch (e) {
        console.error("Failed to materialise plugin editor extension:", e);
      }
    }
    return out;
  }

  // --------------------------- API factory ------------------------------

  private makeApi(pluginId: string, slot: ActivePlugin): PluginAPI {
    const ns = (key: string) => `${pluginId}::${key}`;
    const make = (cleanup: () => void): Disposable => {
      const d = { dispose: cleanup };
      slot.disposables.push(d);
      return d;
    };
    return {
      registerCommand: (cmd) => {
        const key = ns(cmd.id);
        this.commands.set(key, { ...cmd, id: key });
        this.notify();
        return make(() => {
          this.commands.delete(key);
          this.notify();
        });
      },
      registerStatusBarItem: (item) => {
        const key = ns(item.id);
        this.statusItems.set(key, { ...item, id: key });
        this.notify();
        return make(() => {
          this.statusItems.delete(key);
          this.notify();
        });
      },
      registerActivityBarItem: (item) => {
        const key = ns(item.id);
        this.activityItems.set(key, { ...item, id: key });
        this.notify();
        return make(() => {
          this.activityItems.delete(key);
          this.notify();
        });
      },
      registerEditorExtension: (ext) => {
        const key = ns(`ext-${this.rev}-${Math.random().toString(36).slice(2, 8)}`);
        this.editorExtensions.set(key, ext);
        this.notify();
        return make(() => {
          this.editorExtensions.delete(key);
          this.notify();
        });
      },
      onDeactivate: (fn) => {
        slot.deactivateHooks.push(fn);
      },
      log: (...args) => console.log(`[plugin:${pluginId}]`, ...args),
    };
  }
}
