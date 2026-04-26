import { useEffect, useMemo, useRef, useState } from "react";
import "./CommandPalette.css";
import { I } from "./Icons";
import { useSettingsContext } from "../context/SettingsContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useTabs } from "../context/TabsContext";

interface CommandPaletteProps {
  onClose: () => void;
}

interface Cmd {
  id: string;
  kind: string;
  icon: string;
  label: string;
  action: string;
  kbd?: string;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const { shortcuts, lspEnabled } = useSettingsContext();
  const { handleOpenFolder, handleCreateFile } = useWorkspace();
  const { tabs, setActiveTab } = useTabs();

  const [filter, setFilter] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const cmds: Cmd[] = useMemo(() => {
    const base: Cmd[] = [
      {
        id: "file:new",
        kind: "File",
        icon: "📄",
        label: "New File",
        action: "file:new",
        kbd: shortcuts["file:new"],
      },
      {
        id: "file:open",
        kind: "File",
        icon: "📂",
        label: "Open Folder…",
        action: "file:open",
        kbd: shortcuts["file:open"],
      },
      {
        id: "file:save",
        kind: "File",
        icon: "💾",
        label: "Save",
        action: "file:save",
        kbd: shortcuts["file:save"],
      },
      {
        id: "view:toggleSidebar",
        kind: "View",
        icon: "📑",
        label: "Toggle Sidebar",
        action: "view:toggleSidebar",
        kbd: shortcuts["view:toggleSidebar"],
      },
      {
        id: "view:toggleTerminal",
        kind: "View",
        icon: "⌨",
        label: "Toggle Terminal",
        action: "view:toggleTerminal",
        kbd: shortcuts["view:toggleTerminal"],
      },
      {
        id: "view:themeManager",
        kind: "View",
        icon: "🎨",
        label: "Theme Manager",
        action: "view:themeManager",
      },
      {
        id: "settings:open",
        kind: "Cmd",
        icon: "⚙",
        label: "Open Settings",
        action: "settings:open",
        kbd: shortcuts["settings:open"],
      },
      {
        id: "search:toggle",
        kind: "Search",
        icon: "🔍",
        label: "Toggle Editor Search",
        action: "search:toggle",
        kbd: shortcuts["search:toggle"],
      },
      {
        id: "discord:toggle",
        kind: "Cmd",
        icon: "🎮",
        label: "Toggle Discord Rich Presence",
        action: "discord:toggle",
      },
      {
        id: "lsp:toggle",
        kind: "Cmd",
        icon: "🔧",
        label: `Toggle LSP (${lspEnabled ? "ON" : "OFF"})`,
        action: "lsp:toggle",
      },
    ];
    const tabCmds: Cmd[] = tabs.map((t) => ({
      id: `tab:${t.path}`,
      kind: "Goto",
      icon: "↗",
      label: t.name,
      action: `goto-tab:${t.path}`,
    }));
    return [...base, ...tabCmds];
  }, [shortcuts, lspEnabled, tabs]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return cmds;
    return cmds.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.kind.toLowerCase().includes(q) ||
        c.action.toLowerCase().includes(q),
    );
  }, [filter, cmds]);

  useEffect(() => {
    setActive(0);
  }, [filter]);

  const run = (cmd: Cmd) => {
    if (cmd.action.startsWith("goto-tab:")) {
      setActiveTab(cmd.action.slice("goto-tab:".length));
    } else if (cmd.action === "file:open") {
      handleOpenFolder();
    } else if (cmd.action === "file:new") {
      handleCreateFile("nouveau fichier");
    } else {
      window.dispatchEvent(
        new CustomEvent("menu-action", { detail: cmd.action }),
      );
    }
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) run(cmd);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="palette">
      <div className="palette__backdrop" onClick={onClose} />
      <div className="palette__panel">
        <div className="palette__input">
          <I.Search size={14} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
          />
          <kbd className="kbd">Esc</kbd>
        </div>

        <div className="palette__list">
          {filtered.length === 0 && (
            <div
              style={{ padding: 12, color: "var(--text-2)", fontSize: 12 }}
            >
              No commands match.
            </div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`palette__item ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(cmd)}
            >
              <span className="palette__kind">{cmd.kind}</span>
              <span className="palette__icon">{cmd.icon}</span>
              <span className="palette__label">{cmd.label}</span>
              {cmd.kbd && <kbd className="kbd">{cmd.kbd}</kbd>}
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
            <kbd className="kbd">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
