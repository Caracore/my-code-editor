import "./styles/layout.css";
import { Suspense, lazy, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import { ThemeProvider } from "./context/ThemeContext";
import { TabsProvider, useTabs } from "./context/TabsContext";
import { TerminalProvider } from "./context/TerminalContext";
import {
  SettingsProvider,
  useSettingsContext,
} from "./context/SettingsContext";
import {
  WorkspaceProvider,
  useWorkspace,
} from "./context/WorkspaceContext";

import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useDiscordPresence } from "./hooks/useDiscordPresence";
import { useDiscordUpdate } from "./hooks/useDiscordUpdate";
import { detectLanguageFromFilename } from "./utils/detectLanguage";
import { lspManager } from "./lsp";

import TitleBar from "./components/TitleBar";
import ActivityBar from "./components/ActivityBar";
import Sidebar from "./components/Sidebar";
import EditorTabs from "./components/EditorTabs";
import EditorArea from "./components/EditorArea";
import RightPanel from "./components/RightPanel";
import BottomPanel from "./components/BottomPanel";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";

import SettingsPanel from "./components/SettingsPanel/SettingsPanel";
import ThemeManager from "./components/ThemeManager/ThemeManager";

const LazyCodeEditor = lazy(
  () => import("./components/Editor/CodeEditorCM6"),
);

function AppShell() {
  const {
    sidebarVisible,
    rightPanelVisible,
    bottomPanelVisible,
    setBottomPanelVisible,
    setSidebarVisible,
    commandPaletteOpen,
    setCommandPaletteOpen,
    settingsPanelOpen,
    setSettingsPanelOpen,
    themeManagerOpen,
    setThemeManagerOpen,
    setTodoListOpen,
    todoListOpen,
    rootPath,
    tree,
    handleCreateFile,
    handleOpenFolder,
  } = useWorkspace();

  const { tabs, activeTab, markTabAsSaved } = useTabs();
  const { discordEnabled, toggleDiscord, lspEnabled, toggleLsp } =
    useSettingsContext();

  useKeyboardShortcuts();

  // Discord presence
  const currentTab = tabs.find((t) => t.path === activeTab);
  const currentFileName = currentTab
    ? currentTab.path.split(/[\\/]/).pop() || "Untitled"
    : "No file open";
  const currentLanguage = currentTab
    ? detectLanguageFromFilename(currentTab.path)
    : "Text";
  const projectName =
    tree.length > 0 && tree[0].path
      ? tree[0].path.split(/[\\/]/).pop() || "My Code Editor"
      : "My Code Editor";

  useDiscordPresence({
    fileName: currentFileName,
    language: currentLanguage,
    projectName,
    enabled: discordEnabled,
  });
  useDiscordUpdate({
    fileName: currentFileName,
    language: currentLanguage,
    projectName,
    enabled: discordEnabled,
    throttleMs: 3000,
  });

  useEffect(() => {
    if (!discordEnabled) return;
    invoke("init_discord_rpc").catch((e) =>
      console.error("Discord init failed", e),
    );
  }, [discordEnabled]);

  useEffect(() => {
    if (rootPath) lspManager.setRootPath(rootPath);
  }, [rootPath]);
  useEffect(() => () => void lspManager.stopAllServers(), []);

  async function saveActiveFile() {
    if (!activeTab) return;
    const file = tabs.find((t) => t.path === activeTab);
    if (!file) return;
    await invoke("save_file", { path: activeTab, content: file.content });
    markTabAsSaved(activeTab);
    try {
      await (lspManager as any).saveDocument?.(activeTab, file.content);
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveActiveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tabs, activeTab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handler = () => saveActiveFile();
    window.addEventListener("save-file", handler);
    return () => window.removeEventListener("save-file", handler);
  }, [tabs, activeTab]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      switch (action) {
        case "file:save":
          saveActiveFile();
          break;
        case "file:new":
          handleCreateFile("nouveau fichier");
          break;
        case "file:open":
          handleOpenFolder();
          break;
        case "edit:undo":
          document.execCommand("undo");
          break;
        case "edit:redo":
          document.execCommand("redo");
          break;
        case "view:toggleSidebar":
          setSidebarVisible(!sidebarVisible);
          break;
        case "view:toggleTerminal":
          setBottomPanelVisible(!bottomPanelVisible);
          break;
        case "view:toggleTodoList":
          setTodoListOpen(!todoListOpen);
          break;
        case "view:themeManager":
          setThemeManagerOpen(!themeManagerOpen);
          break;
        case "settings:open":
          setSettingsPanelOpen(!settingsPanelOpen);
          break;
        case "discord:toggle":
          try {
            if (!discordEnabled) await invoke("init_discord_rpc");
            else await invoke("disconnect_discord_rpc");
            toggleDiscord(!discordEnabled);
          } catch (err) {
            console.error("Discord toggle failed", err);
          }
          break;
        case "lsp:toggle":
          if (lspEnabled) await lspManager.stopAllServers();
          toggleLsp(!lspEnabled);
          break;
        default:
          break;
      }
    };
    window.addEventListener("menu-action", handler as EventListener);
    return () =>
      window.removeEventListener("menu-action", handler as EventListener);
  }, [
    tabs,
    activeTab,
    sidebarVisible,
    bottomPanelVisible,
    todoListOpen,
    themeManagerOpen,
    settingsPanelOpen,
    discordEnabled,
    lspEnabled,
  ]);

  return (
    <Suspense fallback={null}>
      <div className="app">
        <TitleBar />
        <div
          className="app__body"
          style={{
            gridTemplateColumns: `var(--activitybar-w) ${
              sidebarVisible ? "auto" : "0px"
            } 1fr ${rightPanelVisible ? "auto" : "0px"}`,
          }}
        >
          <ActivityBar />
          {sidebarVisible && <Sidebar />}
          <main className="app__main">
            <div className="app__editor-area">
              <EditorTabs />
              <EditorArea LazyCodeEditor={LazyCodeEditor} />
            </div>
            {bottomPanelVisible && <BottomPanel />}
          </main>
          {rightPanelVisible && <RightPanel />}
        </div>
        <StatusBar />
        {commandPaletteOpen && (
          <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
        )}
        {settingsPanelOpen && (
          <SettingsPanel onClose={() => setSettingsPanelOpen(false)} />
        )}
        {themeManagerOpen && <ThemeManager />}
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TabsProvider>
        <TerminalProvider>
          <SettingsProvider>
            <WorkspaceProvider>
              <AppShell />
            </WorkspaceProvider>
          </SettingsProvider>
        </TerminalProvider>
      </TabsProvider>
    </ThemeProvider>
  );
}
