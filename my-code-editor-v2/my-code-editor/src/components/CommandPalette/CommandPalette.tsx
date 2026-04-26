import { useEffect, useState } from "react";
import { I } from "../Icons";
import "./CommandPalette.css";

type Item = {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  shortcut?: string;
  group: string;
};

const ITEMS: Item[] = [
  { group: "Files",   icon: <I.File size={13} />,     title: "Go to File…",          hint: "Search files by name", shortcut: "Ctrl P" },
  { group: "Files",   icon: <I.Plus size={13} />,     title: "New File",             shortcut: "Ctrl N" },
  { group: "Code",    icon: <I.Search size={13} />,   title: "Find in Files",        shortcut: "Ctrl Shift F" },
  { group: "Code",    icon: <I.Sparkle size={13} />,  title: "AI: Refactor selection", shortcut: "Ctrl Shift R" },
  { group: "Code",    icon: <I.Ai size={13} />,       title: "AI: Generate tests" },
  { group: "Run",     icon: <I.Play size={13} />,     title: "Run 'dev'",            shortcut: "Shift F10" },
  { group: "Run",     icon: <I.Debug size={13} />,    title: "Debug current file",   shortcut: "Shift F9" },
  { group: "Git",     icon: <I.Branch size={13} />,   title: "Git: Switch branch" },
  { group: "Git",     icon: <I.Git size={13} />,      title: "Git: Commit…" },
  { group: "Window",  icon: <I.Settings size={13} />, title: "Preferences",          shortcut: "Ctrl ," },
  { group: "Window",  icon: <I.Terminal size={13} />, title: "Toggle Terminal",      shortcut: "Ctrl `" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setIdx(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) {
    return (
      <button className="cmd-hint" onClick={() => setOpen(true)} title="Search Everywhere">
        <I.Search size={12} /> <span>Search anything…</span> <kbd>Ctrl K</kbd>
      </button>
    );
  }

  const filtered = ITEMS.filter((i) =>
    i.title.toLowerCase().includes(q.toLowerCase()) ||
    i.group.toLowerCase().includes(q.toLowerCase())
  );

  // group by section
  const groups = filtered.reduce<Record<string, Item[]>>((acc, it) => {
    (acc[it.group] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd__input">
          <I.Search size={15} />
          <input
            autoFocus
            placeholder="Type a command, file, symbol, or AI prompt…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setIdx((n) => Math.min(filtered.length - 1, n + 1));
              if (e.key === "ArrowUp")   setIdx((n) => Math.max(0, n - 1));
              if (e.key === "Enter")     setOpen(false);
            }}
          />
          <kbd>esc</kbd>
        </div>

        <div className="cmd__results">
          {Object.entries(groups).map(([g, items]) => (
            <div key={g} className="cmd__group">
              <div className="cmd__group-label">{g}</div>
              {items.map((it) => {
                const flatIndex = filtered.indexOf(it);
                const active = flatIndex === idx;
                return (
                  <div
                    key={it.title}
                    className={`cmd__item ${active ? "is-active" : ""}`}
                    onMouseEnter={() => setIdx(flatIndex)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="cmd__icon">{it.icon}</span>
                    <span className="cmd__title">{it.title}</span>
                    {it.hint && <span className="cmd__hint">{it.hint}</span>}
                    {it.shortcut && (
                      <span className="cmd__sc">
                        {it.shortcut.split(" ").map((k) => <kbd key={k}>{k}</kbd>)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="cmd__empty">
              <I.Sparkle size={14} />
              <span>No matches. Press <kbd>Enter</kbd> to ask the AI: "{q}"</span>
            </div>
          )}
        </div>

        <div className="cmd__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>tab</kbd> next scope</span>
          <span style={{ marginLeft: "auto" }}>my-code-editor</span>
        </div>
      </div>
    </div>
  );
}

