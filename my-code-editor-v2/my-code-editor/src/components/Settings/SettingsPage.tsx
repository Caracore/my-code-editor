import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { I } from "../Icons";
import {
  DEFAULT_SETTINGS,
  useUserSettings,
} from "../../context/UserSettingsContext";
import type { UserSettings } from "../../context/UserSettingsContext";
import "./SettingsPage.css";

interface Props {
  onClose: () => void;
}

type SectionId = "editor" | "terminal" | "appearance" | "behaviour" | "shortcuts" | "about";
const SECTIONS: { id: SectionId; label: string; icon: ReactElement }[] = [
  { id: "editor",     label: "Editor",     icon: <I.File size={13} /> },
  { id: "terminal",   label: "Terminal",   icon: <I.Terminal size={13} /> },
  { id: "appearance", label: "Appearance", icon: <I.Sparkle size={13} /> },
  { id: "behaviour",  label: "Behaviour",  icon: <I.Settings size={13} /> },
  { id: "shortcuts",  label: "Shortcuts",  icon: <I.Search size={13} /> },
  { id: "about",      label: "About",      icon: <I.Ai size={13} /> },
];

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: "Ctrl+B",        desc: "Toggle Sidebar" },
  { keys: "Ctrl+J",        desc: "Toggle Bottom Panel" },
  { keys: "Ctrl+Alt+B",    desc: "Toggle AI Panel" },
  { keys: "Ctrl+`",        desc: "Focus Terminal" },
  { keys: "Ctrl+Shift+`",  desc: "New Terminal" },
  { keys: "Ctrl+K",        desc: "Command Palette" },
  { keys: "Ctrl+P",        desc: "Go to File" },
  { keys: "Ctrl+S",        desc: "Save File" },
  { keys: "Ctrl+W",        desc: "Close Editor" },
  { keys: "Ctrl+O",        desc: "Open Folder" },
  { keys: "Ctrl+,",        desc: "Open Settings" },
  { keys: "Ctrl+R",        desc: "Reload Window" },
  { keys: "F11",           desc: "Toggle Full Screen" },
];

export default function SettingsPage({ onClose }: Props) {
  const { settings, set, reset } = useUserSettings();
  const [section, setSection] = useState<SectionId>("editor");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    </section>
  );
}

function ShortcutsSection({ filter }: { filter: string | null }) {
  const rows = filter
    ? SHORTCUTS.filter(
        (s) =>
          s.desc.toLowerCase().includes(filter) ||
          s.keys.toLowerCase().includes(filter),
      )
    : SHORTCUTS;
  return (
    <section className="set-section">
      <h2>Keyboard shortcuts</h2>
      <table className="set-shortcuts">
        <thead>
          <tr><th>Action</th><th>Combo</th></tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.keys + s.desc}>
              <td>{s.desc}</td>
              <td>
                {s.keys.split("+").map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={2} className="set-shortcuts__empty">No matching shortcut.</td></tr>
          )}
        </tbody>
      </table>
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
