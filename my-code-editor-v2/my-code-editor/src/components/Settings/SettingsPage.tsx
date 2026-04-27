import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { I } from "../Icons";
import {
  DEFAULT_SETTINGS,
  useUserSettings,
} from "../../context/UserSettingsContext";
import type { UserSettings } from "../../context/UserSettingsContext";
import { usePlugins } from "../../plugins/PluginsContext";
import { lspManager } from "../../lsp";
import {
  KEYMAP_DEFS,
  DEFAULT_KEYMAP,
  comboFromEvent,
  displayCombo,
  isModifierOnly,
} from "../../config/keymap";
import "./SettingsPage.css";

interface Props {
  onClose: () => void;
}

type SectionId =
  | "editor"
  | "terminal"
  | "appearance"
  | "behaviour"
  | "extensions"
  | "shortcuts"
  | "about";
const SECTIONS: { id: SectionId; label: string; icon: ReactElement }[] = [
  { id: "editor",     label: "Editor",     icon: <I.File size={13} /> },
  { id: "terminal",   label: "Terminal",   icon: <I.Terminal size={13} /> },
  { id: "appearance", label: "Appearance", icon: <I.Sparkle size={13} /> },
  { id: "behaviour",  label: "Behaviour",  icon: <I.Settings size={13} /> },
  { id: "extensions", label: "Extensions", icon: <I.Extensions size={13} /> },
  { id: "shortcuts",  label: "Shortcuts",  icon: <I.Search size={13} /> },
  { id: "about",      label: "About",      icon: <I.Ai size={13} /> },
];

export default function SettingsPage({ onClose }: Props) {
  const { settings, set, reset } = useUserSettings();
  const [section, setSection] = useState<SectionId>("editor");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onSection = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (typeof id === "string") setSection(id as SectionId);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("settings:set-section", onSection);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("settings:set-section", onSection);
    };
  }, [onClose]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return q;
  }, [query]);

  return (
    <div className="settings-overlay" role="dialog" aria-label="Settings">
      <div className="settings">
        <header className="settings__header">
          <div className="settings__title">
            <I.Settings size={15} />
            <span>Settings</span>
          </div>
          <div className="settings__search">
            <I.Search size={13} />
            <input
              autoFocus
              placeholder="Search settings…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="settings__head-actions">
            <button className="settings__ghost" onClick={reset} title="Reset to defaults">
              Reset
            </button>
            <button className="settings__close" onClick={onClose} title="Close (Esc)">
              <I.Close size={13} />
            </button>
          </div>
        </header>

        <div className="settings__body">
          <nav className="settings__nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`settings__nav-item ${section === s.id ? "is-active" : ""}`}
                onClick={() => setSection(s.id)}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <main className="settings__content">
            {section === "editor" && <EditorSection settings={settings} set={set} filter={matches} />}
            {section === "terminal" && <TerminalSection settings={settings} set={set} filter={matches} />}
            {section === "appearance" && <AppearanceSection settings={settings} set={set} filter={matches} />}
            {section === "behaviour" && <BehaviourSection settings={settings} set={set} filter={matches} />}
            {section === "extensions" && <ExtensionsSection filter={matches} />}
            {section === "shortcuts" && <ShortcutsSection filter={matches} />}
            {section === "about" && <AboutSection />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Building blocks                                                  */
/* ---------------------------------------------------------------- */

interface FieldProps {
  label: string;
  hint?: string;
  filter?: string | null;
  children: React.ReactNode;
}
function Field({ label, hint, filter, children }: FieldProps) {
  if (filter && !label.toLowerCase().includes(filter) && !(hint?.toLowerCase().includes(filter))) {
    return null;
  }
  return (
    <div className="set-field">
      <div className="set-field__label">
        <span>{label}</span>
        {hint && <span className="set-field__hint">{hint}</span>}
      </div>
      <div className="set-field__control">{children}</div>
    </div>
  );
}

function Toggle({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`set-toggle ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="set-toggle__knob" />
    </button>
  );
}

function NumberInput({
  value, min, max, step = 1, onChange,
}: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="set-number">
      <button onClick={() => onChange(Math.max(min, value - step))} aria-label="decrease">−</button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
      <button onClick={() => onChange(Math.min(max, value + step))} aria-label="increase">+</button>
    </div>
  );
}

function Select<T extends string | number>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <select
      className="set-select"
      value={String(value)}
      onChange={(e) => {
        const o = options.find((o) => String(o.value) === e.target.value);
        if (o) onChange(o.value);
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ColorSwatches({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="set-swatches">
      {options.map((c) => (
        <button
          key={c}
          className={`set-swatch ${value.toLowerCase() === c.toLowerCase() ? "is-active" : ""}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="set-color-input"
        title="Custom"
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Sections                                                         */
/* ---------------------------------------------------------------- */

interface SectionProps {
  settings: UserSettings;
  set: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  filter: string | null;
}

function EditorSection({ settings, set, filter }: SectionProps) {
  return (
    <section className="set-section">
      <h2>Editor</h2>
      <Field label="Font size" hint="Pixels for the code editor" filter={filter}>
        <NumberInput
          value={settings.editorFontSize}
          min={10}
          max={22}
          onChange={(v) => set("editorFontSize", v)}
        />
      </Field>
      <Field label="Font family" hint="CSS font stack" filter={filter}>
        <input
          className="set-text"
          value={settings.editorFontFamily}
          onChange={(e) => set("editorFontFamily", e.target.value)}
          spellCheck={false}
        />
      </Field>
      <Field label="Tab size" filter={filter}>
        <Select
          value={settings.editorTabSize}
          options={[
            { value: 2, label: "2 spaces" },
            { value: 4, label: "4 spaces" },
            { value: 8, label: "8 spaces" },
          ]}
          onChange={(v) => set("editorTabSize", v)}
        />
      </Field>
      <Field label="Line numbers" filter={filter}>
        <Toggle checked={settings.editorLineNumbers} onChange={(v) => set("editorLineNumbers", v)} />
      </Field>
      <Field label="Word wrap" filter={filter}>
        <Toggle checked={settings.editorWordWrap} onChange={(v) => set("editorWordWrap", v)} />
      </Field>
      <Field label="Highlight active line" filter={filter}>
        <Toggle checked={settings.editorActiveLine} onChange={(v) => set("editorActiveLine", v)} />
      </Field>
      <Field label="Minimap" hint="Reserved for a future release" filter={filter}>
        <Toggle checked={settings.editorMinimap} onChange={(v) => set("editorMinimap", v)} />
      </Field>
    </section>
  );
}

function TerminalSection({ settings, set, filter }: SectionProps) {
  return (
    <section className="set-section">
      <h2>Terminal</h2>
      <Field label="Font size" filter={filter}>
        <NumberInput
          value={settings.terminalFontSize}
          min={10}
          max={20}
          onChange={(v) => set("terminalFontSize", v)}
        />
      </Field>
      <Field label="Cursor blink" filter={filter}>
        <Toggle
          checked={settings.terminalCursorBlink}
          onChange={(v) => set("terminalCursorBlink", v)}
        />
      </Field>
    </section>
  );
}

function AppearanceSection({ settings, set, filter }: SectionProps) {
  const presets = ["#7c5cff", "#5ad1ff", "#4ade80", "#f5b14c", "#f25f5c", "#c792ea", "#82aaff"];
  return (
    <section className="set-section">
      <h2>Appearance</h2>
      <Field label="Accent color" hint="Drives --accent across the UI" filter={filter}>
        <ColorSwatches
          value={settings.accentColor}
          options={presets}
          onChange={(v) => set("accentColor", v)}
        />
      </Field>
      <Field label="UI density" filter={filter}>
        <Select
          value={settings.uiDensity}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
          ]}
          onChange={(v) => set("uiDensity", v)}
        />
      </Field>
    </section>
  );
}

function BehaviourSection({ settings, set, filter }: SectionProps) {
  return (
    <section className="set-section">
      <h2>Behaviour</h2>
      <Field label="Auto-save on focus loss" filter={filter}>
        <Toggle checked={settings.autoSave} onChange={(v) => set("autoSave", v)} />
      </Field>
      <Field label="Confirm before quitting" filter={filter}>
        <Toggle checked={settings.confirmOnExit} onChange={(v) => set("confirmOnExit", v)} />
      </Field>
      <Field label="Discord Rich Presence" hint="Show what you're coding in Discord" filter={filter}>
        <Toggle checked={settings.discordRpc} onChange={(v) => set("discordRpc", v)} />
      </Field>
      <Field
        label="Language servers (LSP)"
        hint="Diagnostics, completion and inlay hints from rust-analyzer, pylsp, typescript-language-server…"
        filter={filter}
      >
        <Toggle
          checked={settings.lspEnabled}
          onChange={(v) => {
            set("lspEnabled", v);
            // Free running servers immediately when the user disables LSP.
            if (!v) void lspManager.stopAllServers();
          }}
        />
      </Field>
    </section>
  );
}

function ShortcutsSection({ filter }: { filter: string | null }) {
  const { settings, set } = useUserSettings();
  const keymap = settings.keymap;
  // action currently being rebound (null = idle).
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // While capturing, intercept the next keystroke globally and store it.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Escape cancels.
      if (e.key === "Escape") {
        setEditing(null);
        setError(null);
        return;
      }
      const combo = comboFromEvent(e);
      if (isModifierOnly(combo)) return; // wait for the actual key

      // Reject conflicts: combo already bound to a different action.
      const conflict = Object.entries(keymap).find(
        ([a, c]) => c === combo && a !== editing,
      );
      if (conflict) {
        const def = KEYMAP_DEFS.find((d) => d.action === conflict[0]);
        setError(`Already bound to “${def?.label ?? conflict[0]}”`);
        return;
      }
      const next = { ...keymap, [editing]: combo };
      set("keymap", next);
      setEditing(null);
      setError(null);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as any);
  }, [editing, keymap, set]);

  const resetOne = (action: string) => {
    const next = { ...keymap, [action]: DEFAULT_KEYMAP[action] ?? "" };
    set("keymap", next);
  };
  const clearOne = (action: string) => {
    const next = { ...keymap };
    delete next[action];
    set("keymap", next);
  };
  const resetAll = () => set("keymap", { ...DEFAULT_KEYMAP });

  // Group rows for display.
  const rows = useMemo(() => {
    const filt = (d: (typeof KEYMAP_DEFS)[number]) => {
      if (!filter) return true;
      const combo = (keymap[d.action] ?? "").toLowerCase();
      return (
        d.label.toLowerCase().includes(filter) ||
        d.action.toLowerCase().includes(filter) ||
        combo.includes(filter)
      );
    };
    return KEYMAP_DEFS.filter(filt);
  }, [filter, keymap]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!m.has(r.group)) m.set(r.group, [] as typeof rows);
      m.get(r.group)!.push(r);
    }
    return [...m.entries()];
  }, [rows]);

  return (
    <section className="set-section">
      <div className="set-section__head">
        <h2>Keyboard shortcuts</h2>
        <button className="settings__ghost" onClick={resetAll} title="Restore default keymap">
          Reset all
        </button>
      </div>
      <p className="set-field__hint" style={{ marginTop: 0 }}>
        Click a binding to rebind it. Press the new combination, or Escape to cancel.
      </p>
      {editing && error && (
        <div className="set-shortcuts__error" role="alert">{error}</div>
      )}

      {groups.map(([group, list]) => (
        <div key={group} className="set-shortcuts__group">
          <h3 className="set-shortcuts__group-title">{group}</h3>
          <table className="set-shortcuts">
            <tbody>
              {list.map((d) => {
                const combo = keymap[d.action] ?? "";
                const isEditing = editing === d.action;
                const isDefault = combo === DEFAULT_KEYMAP[d.action];
                return (
                  <tr key={d.action}>
                    <td className="set-shortcuts__label">
                      <div>{d.label}</div>
                      <div className="set-shortcuts__action-id">{d.action}</div>
                    </td>
                    <td className="set-shortcuts__combo">
                      <button
                        className={
                          "set-shortcuts__binding" +
                          (isEditing ? " is-editing" : "") +
                          (!combo ? " is-empty" : "")
                        }
                        onClick={() => {
                          setError(null);
                          setEditing(isEditing ? null : d.action);
                        }}
                        title={isEditing ? "Press the new combination (Esc to cancel)" : "Click to rebind"}
                      >
                        {isEditing
                          ? "Press a key…"
                          : combo
                            ? displayCombo(combo).split("+").map((k, i, arr) => (
                                <span key={i}>
                                  <kbd>{k}</kbd>
                                  {i < arr.length - 1 && <span className="set-shortcuts__plus">+</span>}
                                </span>
                              ))
                            : <em>unbound</em>}
                      </button>
                    </td>
                    <td className="set-shortcuts__row-actions">
                      {!isDefault && (
                        <button
                          className="settings__ghost"
                          onClick={() => resetOne(d.action)}
                          title="Reset to default"
                        >
                          Reset
                        </button>
                      )}
                      {combo && (
                        <button
                          className="settings__ghost"
                          onClick={() => clearOne(d.action)}
                          title="Remove binding"
                        >
                          Clear
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="set-shortcuts__empty">No matching shortcut.</div>
      )}
    </section>
  );
}

function ExtensionsSection({ filter }: { filter: string | null }) {
  const {
    themes,
    activeTheme,
    setActiveTheme,
    knownPlugins,
    enabledPlugins,
    togglePlugin,
    reload,
    openExtensionsDir,
    importExtension,
  } = usePlugins();

  const onImport = async (kind: "themes" | "plugins") => {
    try {
      const name = await importExtension(kind);
      if (name) console.info(`[extensions] imported ${kind}/${name}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      window.alert(`Could not import ${kind}: ${msg}`);
    }
  };

  const themeMatches = (t: { id: string; name: string; description?: string }) => {
    if (!filter) return true;
    return (
      t.name.toLowerCase().includes(filter) ||
      t.id.toLowerCase().includes(filter) ||
      (t.description?.toLowerCase().includes(filter) ?? false)
    );
  };

  return (
    <section className="set-section">
      <h2>Themes</h2>
      <p className="set-section__hint">
        Drop additional <code>*.json</code> theme files into your themes folder
        to extend this list.
      </p>
      <div className="ext-grid">
        {themes.filter(themeMatches).map((t) => {
          const isActive = activeTheme?.id === t.id;
          return (
            <button
              key={t.id}
              className={`ext-card ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTheme(t.id)}
            >
              <div className="ext-card__swatches">
                <span style={{ background: t.variables["--bg-1"] ?? "#222" }} />
                <span style={{ background: t.variables["--bg-3"] ?? "#333" }} />
                <span style={{ background: t.variables["--accent"] ?? "#7c5cff" }} />
                <span style={{ background: t.variables["--accent-2"] ?? "#5ad1ff" }} />
              </div>
              <div className="ext-card__title">{t.name}</div>
              <div className="ext-card__meta">
                <span className={`ext-tag ext-tag--${t.type}`}>{t.type}</span>
                <span className="ext-tag">{t.source ?? "builtin"}</span>
              </div>
              {t.description && <div className="ext-card__desc">{t.description}</div>}
            </button>
          );
        })}
      </div>
      <div className="ext-actions">
        <button className="settings__primary" onClick={() => void onImport("themes")}>
          Import theme…
        </button>
        <button className="settings__ghost" onClick={() => openExtensionsDir("themes")}>
          Open themes folder
        </button>
        <button className="settings__ghost" onClick={() => void reload()}>
          Reload from disk
        </button>
      </div>

      <h2 style={{ marginTop: 28 }}>Plugins</h2>
      <p className="set-section__hint">
        Built-in plugins ship with the IDE; user plugins live in your plugins
        folder as <code>*.js</code> modules using <code>module.exports</code>.
      </p>
      <div className="ext-list">
        {knownPlugins
          .filter((p) =>
            !filter
              ? true
              : p.manifest.name.toLowerCase().includes(filter) ||
                p.manifest.id.toLowerCase().includes(filter) ||
                (p.manifest.description?.toLowerCase().includes(filter) ?? false),
          )
          .map((p) => {
            const id = p.manifest.id;
            const enabled = enabledPlugins.has(id);
            return (
              <div key={id} className="ext-row">
                <div className="ext-row__main">
                  <div className="ext-row__title">
                    {p.manifest.name}
                    <span className="ext-tag">{p.manifest.source ?? "builtin"}</span>
                    <span className="ext-row__ver">v{p.manifest.version}</span>
                  </div>
                  {p.manifest.description && (
                    <div className="ext-row__desc">{p.manifest.description}</div>
                  )}
                  <div className="ext-row__id">{id}</div>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(v) => void togglePlugin(id, v)}
                />
              </div>
            );
          })}
        {knownPlugins.length === 0 && (
          <div className="ext-empty">No plugins available.</div>
        )}
      </div>
      <div className="ext-actions">
        <button className="settings__primary" onClick={() => void onImport("plugins")}>
          Import plugin…
        </button>
        <button className="settings__ghost" onClick={() => openExtensionsDir("plugins")}>
          Open plugins folder
        </button>
        <button className="settings__ghost" onClick={() => void reload()}>
          Reload from disk
        </button>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="set-section set-about">
      <h2>About</h2>
      <p><b>my-code-editor</b> · v0.1.0</p>
      <p>A lightweight Tauri + React + CodeMirror 6 IDE.</p>
      <p className="set-about__muted">
        Built with Tauri 2, React 19, CodeMirror 6, xterm.js. Theme inspired by
        JetBrains Darcula+.
      </p>
      <pre className="set-about__build">
        defaults file: localStorage["my-code-editor:user-settings:v1"]{"\n"}
        accent default: {DEFAULT_SETTINGS.accentColor}
      </pre>
    </section>
  );
}
