import { useEffect, useMemo, useState } from "react";
import { I } from "../Icons";
import { usePlugins } from "../../plugins/PluginsContext";
import "./CommandPalette.css";

type Item = {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  shortcut?: string;
  group: string;
  action?: () => void;
};

const ITEMS: Item[] = [
  { group: "Files",   icon: <I.File size={13} />,     title: "Go to File…",          hint: "Search files by name", shortcut: "Ctrl P", action: () => window.dispatchEvent(new CustomEvent("fileSearch:open")) },
  { group: "Files",   icon: <I.Plus size={13} />,     title: "New File",             shortcut: "Ctrl N", action: () => window.dispatchEvent(new CustomEvent("file:new")) },
  { group: "Code",    icon: <I.Search size={13} />,   title: "Find in Files",        shortcut: "Ctrl Shift F", action: () => window.dispatchEvent(new CustomEvent("findInFiles:open")) },
  { group: "Code",    icon: <I.Sparkle size={13} />,  title: "AI: Refactor selection", shortcut: "Ctrl Shift R", action: () => window.dispatchEvent(new CustomEvent("aiRefactor:open")) },
  { group: "Code",    icon: <I.Ai size={13} />,       title: "AI: Generate tests",   shortcut: "Ctrl Shift T", action: () => window.dispatchEvent(new CustomEvent("aiGenerateTests:open")) },
  { group: "Run",     icon: <I.Play size={13} />,     title: "Run 'dev'",            shortcut: "Shift F10", action: () => window.dispatchEvent(new CustomEvent("runCommand", { detail: "dev" })) },
  { group: "Run",     icon: <I.Debug size={13} />,    title: "Debug current file",   shortcut: "Shift F9", action: () => window.dispatchEvent(new CustomEvent("debug:open")) },
  { group: "Git",     icon: <I.Branch size={13} />,   title: "Git: Switch branch", action: () => window.dispatchEvent(new CustomEvent("git:switchBranch")) },
  { group: "Git",     icon: <I.Git size={13} />,      title: "Git: Commit…", action: () => window.dispatchEvent(new CustomEvent("git:commit")) },
  { group: "Window",  icon: <I.Settings size={13} />, title: "Preferences",          shortcut: "Ctrl ,", action: () => window.dispatchEvent(new CustomEvent("preferences:open")) },
  { group: "Window",  icon: <I.Terminal size={13} />, title: "Toggle Terminal",      shortcut: "Ctrl `", action: () => window.dispatchEvent(new CustomEvent("terminal:toggle")) },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const { commands: pluginCommands } = usePlugins();

  const allItems = useMemo<Item[]>(() => {
    const pluginItems: Item[] = pluginCommands.map((c) => ({
      group: c.group ?? "Plugins",
      icon: <I.Extensions size={13} />,
      title: c.title,
      shortcut: c.shortcut,
      action: () => { void c.run(); },
    }));
    return [...ITEMS, ...pluginItems];
  }, [pluginCommands]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setIdx(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => {
      setOpen(true);
      setQ("");
      setIdx(0);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("commandPalette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("commandPalette:open", onOpen);
    };
  }, []);

  if (!open) {
    return (
      <button className="cmd-hint" onClick={() => setOpen(true)} title="Search Everywhere">
        <I.Search size={12} /> <span>Search anything…</span> <kbd>Ctrl K</kbd>
      </button>
    );
  }

  const filtered = allItems.filter((i) =>
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
                    onClick={() => { setOpen(false); it.action?.(); }}
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

