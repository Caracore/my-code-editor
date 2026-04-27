import type { ThemeManifest } from "./types";
import { THEMEABLE_VARS } from "./types";

const ATTR = "data-theme";
const TYPE_ATTR = "data-theme-type";
/** Vars set by the currently-applied theme — tracked so we can clean up on switch. */
let appliedVars: string[] = [];

/**
 * Apply a theme by writing its variables onto `:root`.
 * Variables not in the manifest are *kept untouched* (fall back to defaults
 * declared in `src/styles/theme.css`).
 */
export function applyTheme(theme: ThemeManifest): void {
  const root = document.documentElement;
  // Remove vars set by the previous theme that are not in the new one.
  for (const v of appliedVars) {
    if (!(v in theme.variables)) root.style.removeProperty(v);
  }
  const next: string[] = [];
  for (const [k, value] of Object.entries(theme.variables)) {
    if (!(THEMEABLE_VARS as readonly string[]).includes(k)) continue;
    root.style.setProperty(k, value);
    next.push(k);
  }
  appliedVars = next;
  root.setAttribute(ATTR, theme.id);
  root.setAttribute(TYPE_ATTR, theme.type);
}

/** Validate & coerce a parsed JSON object into a ThemeManifest. Throws on bad shape. */
export function parseThemeJson(raw: unknown, source: "builtin" | "user" = "user"): ThemeManifest {
  if (!raw || typeof raw !== "object") throw new Error("theme is not an object");
  const obj = raw as Record<string, unknown>;
  const id = String(obj.id ?? "").trim();
  if (!id) throw new Error("theme.id is required");
  const name = String(obj.name ?? id);
  const type = obj.type === "light" ? "light" : "dark";
  const variables = (obj.variables ?? obj.colors ?? {}) as Record<string, unknown>;
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(variables)) {
    if (typeof v !== "string") continue;
    if (!(THEMEABLE_VARS as readonly string[]).includes(k)) continue;
    cleaned[k] = v;
  }
  return {
    id,
    name,
    type,
    description: typeof obj.description === "string" ? obj.description : undefined,
    author: typeof obj.author === "string" ? obj.author : undefined,
    source,
    variables: cleaned,
  };
}
