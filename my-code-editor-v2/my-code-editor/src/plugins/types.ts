import type { Extension } from "@codemirror/state";
import type React from "react";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  /** Set automatically by the manager. */
  source?: "builtin" | "user";
}

export interface PluginCommand {
  id: string;
  title: string;
  group?: string;
  shortcut?: string;
  run(): void | Promise<void>;
}

export interface PluginStatusBarItem {
  id: string;
  align: "left" | "right";
  /** Lower number = closer to centre. Sorted ascending. */
  order?: number;
  render: () => React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
}

export interface PluginActivityBarItem {
  id: string;
  label: string;
  icon: () => React.ReactNode;
  onClick?: () => void;
}

export interface Disposable {
  dispose(): void;
}

export interface PluginAPI {
  registerCommand(cmd: PluginCommand): Disposable;
  registerStatusBarItem(item: PluginStatusBarItem): Disposable;
  registerActivityBarItem(item: PluginActivityBarItem): Disposable;
  /** Pass either an Extension or a factory; included next time editors mount/refresh. */
  registerEditorExtension(ext: Extension | (() => Extension)): Disposable;
  /** Convenience: receive lifecycle event when plugin is being disabled. */
  onDeactivate(fn: () => void): void;
  /** Show a toast / log line. Delegates to console for now. */
  log(...args: unknown[]): void;
}

export interface Plugin {
  manifest: PluginManifest;
  activate(api: PluginAPI): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
