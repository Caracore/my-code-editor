import { Suspense, useEffect, useState } from "react";
import TopMenu from "../components/TopMenu/TopMenu";
import Toolbar from "../components/Toolbar/Toolbar";
import Sidebar from "../components/Sidebar/Sidebar";
import TabsBar from "../components/TabsBar/TabsBar";
import Terminal from "../components/Terminal/Terminal";
import ThemeManager from "../components/ThemeManager/ThemeManager";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";
import WelcomeScreen from "../components/WelcomeScreen/WelcomeScreen";

import { useTabs } from "../context/TabsContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { invoke } from "@tauri-apps/api/core";
import type { FileNode } from "../types/FileNode";

interface MainLayoutProps {
  tree: FileNode[];
  sidebarVisible: boolean;
  onRenameFile: (oldPath: string, newName: string) => void;
  onCreateFile: (name: string) => void;
  onOpenFolder: () => void;
  LazyCodeEditor: any;
  onOpenFileFromTree: (path: string) => void;
  toggleFolder: (node: FileNode) => void;
  onCreateFileFromContext: (folder: string, name: string) => void;
  onCreateFolderFromContext: (folder: string, name: string) => void;
  onTrashFile: (path: string) => Promise<boolean>;
  onDeleteFile: (path: string) => Promise<boolean>;
}

export default function MainLayout({
  tree,
  sidebarVisible,
  onRenameFile,
  onCreateFile,
  onOpenFolder,
  LazyCodeEditor,
  onOpenFileFromTree,
  toggleFolder,
  onCreateFileFromContext,
  onCreateFolderFromContext,
  onTrashFile,
  onDeleteFile,
}: MainLayoutProps) {

  const {
    tabs,
    activeTab,
    // setActiveTab,
    // closeTab,
    updateTabContent,
    markTabAsSaved,
  } = useTabs();

  // ✅ Activer les raccourcis clavier
  useKeyboardShortcuts();

  const [showThemeManager, setShowThemeManager] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // ✅ Ctrl+S → sauvegarde
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveActiveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tabs, activeTab]);

  // ✅ Gérer les actions du menu et des raccourcis
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const action = custom.detail;
      console.log("🔍 Action reçue dans MainLayout:", action);

      switch (action) {
        case "file:save":
          saveActiveFile();
          break;
        case "file:new":
          onCreateFile("nouveau fichier");
          break;
        case "folder:new":
          console.log("TODO: Créer un nouveau dossier");
          break;
        case "file:open":
          onOpenFolder();
          break;
        case "file:saveAs":
          console.log("TODO: Sauvegarder sous...");
          break;
        case "edit:undo":
          document.execCommand('undo');
          break;
        case "edit:redo":
          document.execCommand('redo');
          break;
        case "edit:copy":
          document.execCommand('copy');
          break;
        case "edit:paste":
          document.execCommand('paste');
          break;
        case "view:toggleSidebar":
          // Géré dans App.tsx déjà
          break;
        case "view:toggleTerminal":
          setShowTerminal((v) => !v);
          break;
        case "view:themeManager":
          setShowThemeManager((v) => !v);
          break;
        case "settings:open":
          setShowSettings((v) => !v);
          break;
        default:
          console.log("🔍 Action non gérée:", action);
      }
    };

    window.addEventListener("menu-action", handler as EventListener);
    return () => window.removeEventListener("menu-action", handler as EventListener);
  }, [tabs, activeTab, onCreateFile, onOpenFolder]);

  // ✅ Sauvegarde
  async function saveActiveFile() {
    if (!activeTab) return;
    const file = tabs.find((t) => t.path === activeTab);
    if (!file) return;

    console.log("💾 Sauvegarde du fichier:", activeTab);
    await invoke("save_file", { path: activeTab, content: file.content });
    markTabAsSaved(activeTab);
  }

  const activeFile = tabs.find((t) => t.path === activeTab);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopMenu />

      <Toolbar
        onCreateFile={() => onCreateFile("nouveau fichier")}
        onOpenThemeManager={() => setShowThemeManager((v) => !v)}
      />

      {showThemeManager && <ThemeManager />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {sidebarVisible && (
          <Sidebar
            tree={tree}
            sidebarVisible={sidebarVisible}
            onRenameFile={onRenameFile}
            onOpenFolder={onOpenFolder}
            onOpenFile={onOpenFileFromTree}
            onToggleFolder={toggleFolder}
            onCreateFile={onCreateFile}
            onCreateFileFromContext={onCreateFileFromContext}
            onCreateFolderFromContext={onCreateFolderFromContext}
            onTrashFile={onTrashFile}
            onDeleteFile={onDeleteFile}
          />
        )}

        {/* Zone centrale */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <TabsBar
            // tabs={tabs}
            // activeTab={activeTab}
            // setActiveTab={setActiveTab}
            // closeTab={closeTab}
          />

          <div style={{ flex: 1, overflow: "hidden" }}>
            {!activeFile ? (
              <WelcomeScreen />
            ) : (
              <Suspense fallback={<div style={{ color: "white" }}>Chargement...</div>}>
                <LazyCodeEditor
                  value={activeFile.content}
                  onChange={(newValue: string) =>
                    updateTabContent(activeFile.path, newValue)
                  }
                />
              </Suspense>
            )}
          </div>

          {showTerminal && (
            <div style={{ height: "200px", borderTop: "1px solid #333" }}>
              <Terminal />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
