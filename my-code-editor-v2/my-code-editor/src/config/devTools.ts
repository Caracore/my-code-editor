/**
 * Single source of truth for whether the HTML inspector / devtools-style
 * integrations should be enabled for the running build.
 *
 *   - In `bun run tauri dev` / any Vite dev server, `import.meta.env.DEV`
 *     is `true` -> we keep the native context menu (Inspect Element),
 *     F12 / Ctrl+Shift+I, and Tauri's automatic devtools.
 *   - In production builds (`bun run tauri build`) `import.meta.env.DEV`
 *     is `false` and `import.meta.env.PROD` is `true` -> we suppress the
 *     browser context menu globally (the app's custom menus still work)
 *     and block the standard devtools shortcuts.
 *
 * The matching backend gating happens in `src-tauri/Cargo.toml`: the
 * `tauri` crate is built without the `devtools` feature, so Tauri v2
 * only ships the inspector in debug builds (`#[cfg(debug_assertions)]`).
 */
export const DEVTOOLS_ENABLED: boolean = import.meta.env.DEV === true;
