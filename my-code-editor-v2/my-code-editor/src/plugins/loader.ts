import { invoke } from "@tauri-apps/api/core";
import { parseThemeJson } from "../themes/ThemeManager";
import type { ThemeManifest } from "../themes/types";
import type { Plugin, PluginManifest } from "./types";

interface ExtFile {
  name: string;
  path: string;
}

async function listDir(kind: "themes" | "plugins"): Promise<ExtFile[]> {
  try {
    return (await invoke<ExtFile[]>("list_extensions", { kind })) ?? [];
  } catch (e) {
    console.warn(`[extensions] could not list ${kind}:`, e);
    return [];
  }
}

async function readFile(kind: "themes" | "plugins", name: string): Promise<string | null> {
  try {
    return await invoke<string>("read_extension", { kind, name });
  } catch (e) {
    console.warn(`[extensions] could not read ${kind}/${name}:`, e);
    return null;
  }
}

export async function loadUserThemes(): Promise<ThemeManifest[]> {
  const files = await listDir("themes");
  const out: ThemeManifest[] = [];
  for (const f of files) {
    const src = await readFile("themes", f.name);
    if (!src) continue;
    try {
      const json = JSON.parse(src);
      out.push(parseThemeJson(json, "user"));
    } catch (e) {
      console.warn(`[extensions] invalid theme ${f.name}:`, e);
    }
  }
  return out;
}

/**
 * Evaluate a user plugin source file.
 *
 * Convention: the plugin script is wrapped in a synchronous CommonJS-ish
 * IIFE; the user assigns to `module.exports` (or returns a value).
 *
 *   module.exports = {
 *     manifest: { id: "my-plugin", name: "My", version: "1.0.0" },
 *     activate(api) { ... },
 *   };
 *
 * Security note: this evaluates arbitrary JS from disk. It is acceptable
 * here because Tauri already grants the app full local FS, and the user
 * explicitly chose to drop a file in their own extensions folder. The same
 * trust model as user-installed editor extensions everywhere else.
 */
function evaluatePluginSource(source: string): Plugin | null {
  try {
    const body = `
      "use strict";
      const exports = {};
      const module = { exports };
      ${source};
      return module.exports && Object.keys(module.exports).length
        ? module.exports
        : (typeof plugin !== 'undefined' ? plugin : null);
    `;
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const factory = new Function(body) as () => unknown;
    const result = factory();
    if (!result || typeof result !== "object") return null;
    const r = result as { manifest?: PluginManifest; activate?: Plugin["activate"] };
    if (!r.manifest || typeof r.activate !== "function") return null;
    return {
      manifest: { ...r.manifest, source: "user" },
      activate: r.activate,
      deactivate: (result as Plugin).deactivate,
    };
  } catch (e) {
    console.warn("[extensions] failed to evaluate plugin:", e);
    return null;
  }
}

export async function loadUserPlugins(): Promise<Plugin[]> {
  const files = await listDir("plugins");
  const out: Plugin[] = [];
  for (const f of files) {
    const src = await readFile("plugins", f.name);
    if (!src) continue;
    const p = evaluatePluginSource(src);
    if (p) out.push(p);
  }
  return out;
}

export async function getExtensionsDir(kind: "themes" | "plugins"): Promise<string | null> {
  try {
    return await invoke<string>("extensions_dir", { kind });
  } catch (e) {
    console.warn(`[extensions] cannot resolve ${kind} dir:`, e);
    return null;
  }
}
