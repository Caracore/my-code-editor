# Themes & Plugins

`my-code-editor` ships with a small extension system: drop a JSON file or a JS
script into your user folder and it shows up in **Settings → Extensions** on
the next reload. Built-in themes and plugins live alongside the user ones.

---

## 1. Folders

User extensions live under your home directory:

| Platform | Path |
| --- | --- |
| Windows | `%USERPROFILE%\.my-code-editor\` |
| macOS / Linux | `~/.my-code-editor/` |

Inside that folder:

```
.my-code-editor/
├── themes/        ← *.json files
└── plugins/       ← *.js / *.mjs files
```

Both folders are created on demand by the IDE. You can also open them directly
from **Settings → Extensions → Open themes folder / Open plugins folder**.

---

## 2. Themes

A theme is a flat JSON file that overrides a whitelist of CSS custom
properties on `:root`. Anything not in the manifest falls back to the value
declared in [`src/styles/theme.css`](../src/styles/theme.css).

### 2.1 Minimal example

`~/.my-code-editor/themes/sunset.json`

```json
{
  "id": "sunset",
  "name": "Sunset",
  "type": "dark",
  "description": "Warm orange tones.",
  "author": "you",
  "variables": {
    "--bg-1": "#1a1213",
    "--bg-2": "#211618",
    "--bg-3": "#291b1d",
    "--accent": "#ff8a4c",
    "--accent-2": "#ffd166",
    "--accent-soft": "rgba(255, 138, 76, 0.18)",
    "--on-accent": "#1a1213",
    "--syn-kw": "#ff8a4c",
    "--syn-str": "#ffd166"
  }
}
```

### 2.2 Manifest fields

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Unique identifier. Used as a stable key. |
| `name` | yes | Display name shown in the picker. |
| `type` | yes | `"dark"` or `"light"`. Drives small UI hints. |
| `description` | no | Short tagline shown under the swatch card. |
| `author` | no | Free-form. |
| `variables` | yes | Map of `--var` → CSS value. Unknown keys are silently ignored. |

> `colors` is accepted as an alias of `variables` for compatibility.

### 2.3 Theme tokens

The whitelist of accepted CSS custom properties is defined in
[`src/themes/types.ts`](../src/themes/types.ts) (`THEMEABLE_VARS`). Highlights:

**Surfaces**
`--bg-0` … `--bg-5` (5 background layers, deepest to most-elevated),
`--border-1`, `--border-2`,
`--text-1` … `--text-4` (primary → muted),
`--scrollbar-thumb`, `--scrollbar-thumb-hover`,
`--overlay-bg` (modal backdrops),
`--titlebar-bg-from` / `--titlebar-bg-to`,
`--statusbar-bg-from` / `--statusbar-bg-to`.

**Accents**
`--accent`, `--accent-2`,
`--accent-soft` (≈18% alpha — used for selection, hover),
`--accent-glow-soft` / `--accent-glow-strong`,
`--accent-2-soft`,
`--shadow-accent` (full `box-shadow` value — `"0 6px 18px rgba(...)"`),
`--on-accent` (foreground for accent-coloured surfaces — pick something with
contrast against `--accent`!),
`--on-accent-soft` (≈65% alpha variant of `--on-accent`).

**Semantics**
`--success`, `--warn`, `--danger`, `--danger-strong` (close button),
`--info`.

**Syntax** (CodeMirror highlighting)
`--syn-kw`, `--syn-fn`, `--syn-str`, `--syn-num`, `--syn-com`, `--syn-type`,
`--syn-prop`, `--syn-tag`, `--syn-punct`.

**Misc** `--code-on-light` (text on warm/red badges).

### 2.4 Tips

- Always provide an `--on-accent` matching your accent. Light themes need
  `#ffffff`, dark themes need a near-black like `#0f1115`.
- Light themes should also override `--overlay-bg`, the titlebar/statusbar
  gradients and the scrollbar colours; otherwise modals look harsh.
- You don't need to ship every variable — partial overrides are fine, the
  defaults pick up the rest.

### 2.5 Activate

1. Save your file under `~/.my-code-editor/themes/`.
2. Open **Settings → Extensions** (or click the puzzle icon in the activity
   bar).
3. Click **Reload from disk**.
4. Click your theme's card.

---

## 3. Plugins

A plugin is a JS module that exports `{ manifest, activate, deactivate? }`.
The `activate` function receives a constrained `PluginAPI` it can use to
register UI affordances. Plugins **cannot** read your filesystem, network or
clipboard directly — they extend UI surfaces only.

### 3.1 Minimal example

`~/.my-code-editor/plugins/hello.js`

```js
module.exports = {
  manifest: {
    id: "hello",
    name: "Hello World",
    version: "1.0.0",
    description: "Says hi.",
    author: "you",
  },

  activate(api) {
    api.log("hello plugin loaded");

    api.registerCommand({
      id: "sayHi",
      title: "Hello: Say hi",
      group: "Hello",
      run: () => window.alert("Hi!"),
    });
  },
};
```

### 3.2 Manifest

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Unique identifier. Used as registration namespace prefix. |
| `name` | yes | Display name. |
| `version` | yes | Semver-ish string, free-form. |
| `description` | no | One-liner. |
| `author` | no | Free-form. |

### 3.3 The `PluginAPI`

All registration methods return a `Disposable` (`{ dispose(): void }`). The
manager auto-disposes everything when your plugin is disabled.

```ts
interface PluginAPI {
  registerCommand(cmd: PluginCommand): Disposable;
  registerStatusBarItem(item: PluginStatusBarItem): Disposable;
  registerActivityBarItem(item: PluginActivityBarItem): Disposable;
  registerEditorExtension(ext: Extension | (() => Extension)): Disposable;
  onDeactivate(fn: () => void): void;
  log(...args: unknown[]): void;
}
```

#### `registerCommand`

```js
api.registerCommand({
  id: "doStuff",            // namespaced to "<pluginId>::doStuff"
  title: "My Plugin: Do stuff",
  group: "My Plugin",       // section header in the palette (optional)
  shortcut: "Ctrl+Shift+H", // display only — wiring is up to you
  run: async () => { /* ... */ },
});
```

Commands appear in **Ctrl+K** (the command palette) merged with built-in items.

#### `registerStatusBarItem`

```js
api.registerStatusBarItem({
  id: "wordCount",
  align: "right",       // or "left"
  order: 50,            // lower = closer to centre
  tooltip: "Words in current file",
  onClick: () => api.log("clicked"),
  render: () => "42 words",   // string or React node
});
```

> `render()` is called every time the bar re-renders. If your item must
> refresh on its own schedule (e.g. every minute), dispatch a custom event in
> a `setInterval` and rely on the bar's existing tick listener — see the
> built-in `Status Clock` plugin in
> [`src/plugins/builtin.ts`](../src/plugins/builtin.ts).

#### `registerActivityBarItem`

```js
api.registerActivityBarItem({
  id: "myView",
  label: "My View",
  icon: () => "🌟",      // string or React node
  onClick: () => { /* open something */ },
});
```

#### `registerEditorExtension`

Push a CodeMirror 6 extension into every editor pane. Either a value or a
factory:

```js
const { EditorView } = require("@codemirror/view"); // available because the
                                                    // host bundles CodeMirror
api.registerEditorExtension(
  EditorView.theme({
    ".cm-content": { caretColor: "hotpink" },
  }),
);
```

> User plugins evaluate inside the host's bundle — `@codemirror/*` modules
> are not exposed to plugins yet, so prefer style-driven extensions or wait
> for a future release that injects the editor SDK explicitly.

#### `onDeactivate(fn)`

Register a teardown hook (timers, listeners, etc.):

```js
const interval = setInterval(tick, 1000);
api.onDeactivate(() => clearInterval(interval));
```

#### `log(...args)`

Logs through `console.log` with a `[plugin:<id>]` prefix.

### 3.4 Lifecycle

1. The IDE scans `~/.my-code-editor/plugins/` on startup.
2. Each `*.js` / `*.mjs` is wrapped in a CommonJS-ish shim:
   ```js
   "use strict";
   const exports = {};
   const module = { exports };
   /* your file */
   ```
3. The exported `{ manifest, activate }` is registered in the catalogue.
4. If the plugin's id is in `enabledPlugins` (persisted in user settings),
   the manager calls `activate(api)`.
5. Toggling it off in **Settings → Extensions** runs every `onDeactivate`
   hook then disposes every registered item.

### 3.5 Built-ins

Two built-in plugins ship with the IDE and serve as living examples — see
[`src/plugins/builtin.ts`](../src/plugins/builtin.ts):

- **Hello World** — registers a single command in the palette.
- **Status Clock** — adds a clock to the right of the status bar with a tick
  loop that survives plugin disable.

### 3.6 Security model

Plugins run **with the same privileges as the IDE itself** because they are
evaluated through `new Function(...)`. This is acceptable here because:

- the user explicitly drops the file in their own folder;
- the surface exposed to the script is a typed, narrow API;
- the IDE already has full local-FS access — the plugin scope is no broader
  than what the host provides.

If you don't trust a plugin, **don't drop it in the folder**. There is no
plugin marketplace yet; everything is local-first.

---

## 4. Quick reference

| Action | Where |
| --- | --- |
| Switch theme | Settings → Extensions → click a theme card |
| Toggle a plugin | Settings → Extensions → toggle on the right |
| Open extension folder | Settings → Extensions → "Open themes/plugins folder" |
| Reload from disk | Settings → Extensions → "Reload from disk" |
| Open Extensions view | Activity Bar → puzzle icon |
| Run a plugin command | Ctrl+K → start typing |

---

## 5. Internals (for contributors)

| File | Role |
| --- | --- |
| [`src/themes/types.ts`](../src/themes/types.ts) | `ThemeManifest` + `THEMEABLE_VARS` whitelist |
| [`src/themes/builtin.ts`](../src/themes/builtin.ts) | Bundled themes |
| [`src/themes/ThemeManager.ts`](../src/themes/ThemeManager.ts) | `applyTheme()` + `parseThemeJson()` |
| [`src/plugins/types.ts`](../src/plugins/types.ts) | `Plugin`, `PluginAPI`, item types |
| [`src/plugins/PluginManager.ts`](../src/plugins/PluginManager.ts) | Registry, activate/deactivate, observable |
| [`src/plugins/PluginsContext.tsx`](../src/plugins/PluginsContext.tsx) | React provider, persists enabled set |
| [`src/plugins/loader.ts`](../src/plugins/loader.ts) | Disk loader (`new Function` shim) |
| [`src/plugins/builtin.ts`](../src/plugins/builtin.ts) | Bundled plugins |
| [`src-tauri/src/extensions.rs`](../src-tauri/src/extensions.rs) | Tauri commands `extensions_dir` / `list_extensions` / `read_extension` |
