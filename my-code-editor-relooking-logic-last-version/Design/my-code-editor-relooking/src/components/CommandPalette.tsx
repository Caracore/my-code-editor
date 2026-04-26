import "./CommandPalette.css";
import { I } from "./Icons";

const items = [
  { kind: "Recent", icon: "›", label: "Toggle Terminal", kbd: "Ctrl+`" },
  { kind: "File", icon: "↗", label: "Go to File…", kbd: "Ctrl+P" },
  { kind: "Cmd", icon: "✦", label: "Format Document", kbd: "Shift+Alt+F" },
  { kind: "Cmd", icon: "⚙", label: "Preferences: Color Theme", kbd: "Ctrl+K Ctrl+T" },
  { kind: "Cmd", icon: "⌘", label: "Tauri: Build Production App" },
  { kind: "AI", icon: "✨", label: "Lumen: Explain Selection" },
];

export default function CommandPalette() {
  return (
    <div className="palette" aria-hidden>
      <div className="palette__backdrop" />
      <div className="palette__panel">
        <div className="palette__input">
          <I.Search size={14} />
          <input
            type="text"
            placeholder="Type a command or search…"
            defaultValue=">"
            spellCheck={false}
          />
          <kbd className="kbd">Esc</kbd>
        </div>

        <div className="palette__list">
          {items.map((it, i) => (
            <button key={i} className={`palette__item ${i === 0 ? "is-active" : ""}`}>
              <span className="palette__kind">{it.kind}</span>
              <span className="palette__icon">{it.icon}</span>
              <span className="palette__label">{it.label}</span>
              {it.kbd && <kbd className="kbd">{it.kbd}</kbd>}
            </button>
          ))}
        </div>

        <div className="palette__footer">
          <span>
            <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd">↵</kbd> select
          </span>
          <span>
            <kbd className="kbd">?</kbd> help
          </span>
        </div>
      </div>
    </div>
  );
}
