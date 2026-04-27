import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { I } from "../Icons";
import { usePlugins } from "../../plugins/PluginsContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useProblemsCount } from "../BottomPanel/ProblemsView";
import { lspManager, DiagnosticSeverity } from "../../lsp";
import ContextMenu, { type ContextMenuItem } from "../ContextMenu/ContextMenu";
import "./StatusBar.css";

interface StatusBarProps {
  terminalOpen?: boolean;
  rightOpen?: boolean;
  onToggleTerminal?: () => void;
  onToggleRight?: () => void;
  onOpenSettings?: () => void;
}

/** Id of the built-in Discord Rich Presence plugin. Kept here in sync with
 *  `src/plugins/discordRpc.ts` — both must reference the same id. */
const DISCORD_PLUGIN_ID = "builtin.discord-rpc";

/** Pretty label for an internal language id. */
function languageLabel(lang: string | undefined, ext: string | undefined): string {
  if (!lang && !ext) return "Plain Text";
  switch (lang) {
    case "tsx": return ext === "ts" ? "TypeScript" : "TypeScript JSX";
    case "jsx": return ext === "js" ? "JavaScript" : "JavaScript JSX";
    case "typescript": return "TypeScript";
    case "javascript": return "JavaScript";
    case "css": return "CSS";
    case "html": return "HTML";
    case "json": return "JSON";
    case "python": return "Python";
    case "rust": return "Rust";
    case "cpp": return "C/C++";
    case "markdown": return "Markdown";
    case "toml": return "TOML";
    case "plaintext": return "Plain Text";
    default: return lang ? lang[0].toUpperCase() + lang.slice(1) : "Plain Text";
  }
}

export default function StatusBar({
  terminalOpen = true,
  rightOpen = true,
  onToggleTerminal,
  onToggleRight,
  onOpenSettings,
}: StatusBarProps = {}) {
  const { statusItemsLeft, statusItemsRight } = usePlugins();
  const { activeTab } = useWorkspace();
  const problemsCount = useProblemsCount();
  const { enabledPlugins, togglePlugin, isActive } = usePlugins();

  // Caret position broadcast by the active editor through "editor:cursor".
  // Falls back to (1, 1) when no editor is focused.
  const [caret, setCaret] = useState<{ line: number; col: number; filePath?: string | null }>({
    line: 1,
    col: 1,
  });
  useEffect(() => {
    const onCursor = (e: Event) => {
      const detail = (e as CustomEvent<{ line: number; col: number; filePath?: string | null }>).detail;
      if (!detail) return;
      setCaret({ line: detail.line, col: detail.col, filePath: detail.filePath ?? null });
    };
    window.addEventListener("editor:cursor", onCursor);
    return () => window.removeEventListener("editor:cursor", onCursor);
  }, []);
  // Reset to 1,1 whenever the user switches to a tab without an editor (or
  // closes the last one) so the readout doesn't show a stale position.
  useEffect(() => {
    if (!activeTab) setCaret({ line: 1, col: 1, filePath: null });
  }, [activeTab]);

  // Split problems into errors vs warnings/info so the dedicated badges
  // in the status bar stay accurate.
  const [errCount, warnCount] = useMemo(() => {
    let err = 0;
    let warn = 0;
    for (const { diagnostics } of lspManager.getAllDiagnostics()) {
      for (const d of diagnostics) {
        if (d.severity === DiagnosticSeverity.Error) err++;
        else warn++;
      }
    }
    return [err, warn];
    // Recompute whenever the total changes.
  }, [problemsCount]);

  // Some plugins (like the built-in clock) emit ticks via a custom event so
  // their `render()` returns up-to-date content without re-registering.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const onTick = () => forceTick((n) => n + 1);
    window.addEventListener("plugins:status-tick", onTick);
    return () => window.removeEventListener("plugins:status-tick", onTick);
  }, []);

  const langLabel = languageLabel(activeTab?.language, activeTab?.ext);

  // ----- Discord Rich Presence quick-config menu -----------------------
  const discordEnabled = enabledPlugins.has(DISCORD_PLUGIN_ID);
  const discordActive = isActive(DISCORD_PLUGIN_ID);
  const [discordMenu, setDiscordMenu] = useState<{ x: number; y: number } | null>(null);

  const openDiscordMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Anchor above the status bar button so the menu opens upward.
    setDiscordMenu({ x: rect.left, y: rect.top });
  };

  const reconnectDiscord = async () => {
    try {
      await invoke("discord_disconnect");
    } catch {
      /* ignore */
    }
    try {
      await invoke("discord_connect", { appId: "1451676636259811368" });
      window.dispatchEvent(new CustomEvent("discord-presence:request"));
    } catch (err) {
      console.warn("Discord reconnect failed:", err);
    }
  };

  const discordMenuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        id: "toggle",
        label: discordEnabled ? "Disable Rich Presence" : "Enable Rich Presence",
        icon: <I.CheckSquare size={12} />,
        onSelect: () => void togglePlugin(DISCORD_PLUGIN_ID, !discordEnabled),
      },
      {
        id: "reconnect",
        label: "Reconnect to Discord",
        icon: <I.Branch size={12} />,
        disabled: !discordActive,
        onSelect: () => void reconnectDiscord(),
      },
      { id: "sep", separator: true },
      {
        id: "settings",
        label: "Open Extensions Settings…",
        icon: <I.Settings size={12} />,
        onSelect: () => onOpenSettings?.(),
      },
    ],
    [discordEnabled, discordActive, togglePlugin, onOpenSettings],
  );

  // Status text shown on the button itself.
  const discordStatus = !discordEnabled
    ? "Discord: off"
    : discordActive
      ? "Discord"
      : "Discord…";

  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <button className="sb-item" title="Git branch">
          <I.Branch size={12} /> <span>main</span>
          <span className="sb-mut">↑1 ↓0</span>
        </button>
        <button
          className="sb-item sb-item--err"
          title={`${errCount} error${errCount === 1 ? "" : "s"}`}
          onClick={() => window.dispatchEvent(new CustomEvent("bottompanel:focus", { detail: "problems" }))}
        >
          <I.Error size={12} /> {errCount}
        </button>
        <button
          className="sb-item sb-item--warn"
          title={`${warnCount} warning${warnCount === 1 ? "" : "s"}`}
          onClick={() => window.dispatchEvent(new CustomEvent("bottompanel:focus", { detail: "problems" }))}
        >
          <I.Warn size={12} /> {warnCount}
        </button>
        <button className="sb-item">
          <I.Sparkle size={12} /> AI ready
        </button>
        {statusItemsLeft.map((it) => (
          <button
            key={it.id}
            className="sb-item sb-item--plugin"
            title={it.tooltip}
            onClick={it.onClick}
          >
            {it.render()}
          </button>
        ))}
      </div>

      <div className="statusbar__center">
        <span className="sb-task">
          <span className="sb-task__spinner" />
          Indexing workspace · 84%
        </span>
      </div>

      <div className="statusbar__group">
        <button
          className="sb-item"
          title={
            activeTab
              ? `Line ${caret.line}, Column ${caret.col}`
              : "No file open"
          }
        >
          Ln {caret.line}, Col {caret.col}
        </button>
        <button className="sb-item">Spaces: 2</button>
        <button className="sb-item">UTF-8</button>
        <button className="sb-item">LF</button>
        <button className="sb-item" title={activeTab?.path ?? "No file"}>
          {langLabel}
        </button>
        <button
          className={`sb-item ${discordEnabled && discordActive ? "is-active" : ""}`}
          title="Discord Rich Presence — click to configure"
          onClick={openDiscordMenu}
        >
          <I.Sparkle size={12} /> {discordStatus}
        </button>
        {statusItemsRight.map((it) => (
          <button
            key={it.id}
            className="sb-item sb-item--plugin"
            title={it.tooltip}
            onClick={it.onClick}
          >
            {it.render()}
          </button>
        ))}
        <button
          className={`sb-item ${terminalOpen ? "is-active" : ""}`}
          title="Toggle Terminal (Ctrl+J)"
          onClick={onToggleTerminal}
        >
          <I.Terminal size={12} />
        </button>
        <button
          className={`sb-item ${rightOpen ? "is-active" : ""}`}
          title="Toggle AI panel (Ctrl+Alt+B)"
          onClick={onToggleRight}
        >
          <I.Ai size={12} />
        </button>
        <button className="sb-item" title="Network"><I.Wifi size={12} /></button>
        <button className="sb-item" title="Notifications"><I.Bell size={12} /></button>
        <button
          className="sb-item"
          title="Settings (Ctrl+,)"
          onClick={onOpenSettings}
        >
          <I.Settings size={12} />
        </button>
      </div>
      {discordMenu && (
        <ContextMenu
          x={discordMenu.x}
          y={discordMenu.y}
          items={discordMenuItems}
          onClose={() => setDiscordMenu(null)}
        />
      )}
    </footer>
  );
}


