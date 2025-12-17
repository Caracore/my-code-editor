import { Suspense, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Toolbar from "../components/Toolbar/Toolbar";
import ThemeManager from "../components/ThemeManager/ThemeManager";
import TopMenu from "../components/TopMenu/TopMenu";
import TabsBar from "../components/TabsBar/TabsBar";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";
import { useTabs } from "../context/TabsContext";
import { useTheme } from "../context/ThemeContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import Terminal from "../components/terminal/Terminal";
import TodoList from "../components/TodoList/TodoList";

import "./MainLayout.css";

interface MainLayoutProps {
  tree: any[];
  sidebarVisible: boolean;
  onRenameFile: (oldPath: string, newName: string) => void;
  onCreateFile: (name: string) => void;
  onOpenFolder: () => void;
  LazyCodeEditor: React.ComponentType<any>;
  onOpenFileFromTree: (path: string) => void;
  toggleFolder: (node: any) => void;
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
  const { themeName, setThemeName, currentTheme } = useTheme();
  const { tabs, activeTab } = useTabs();
  useKeyboardShortcuts();

  const activeModel = tabs.find((t) => t.path === activeTab)?.model ?? null;
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Écouter l'action toggle terminal depuis le menu
  useEffect(() => {
    const handleMenuAction = (e: CustomEvent) => {
      if (e.detail === "view:toggleTerminal") {
        setShowTerminal((prev) => !prev);
      }
      if (e.detail === "settings:open") {
        setShowSettings(true);
      }
      if (e.detail === "file:new") {
        // Déclencher la création dans la sidebar
        window.dispatchEvent(new CustomEvent("sidebar-action", { detail: "sidebar:createFile" }));
      }
      if (e.detail === "folder:new") {
        // Déclencher la création dans la sidebar
        window.dispatchEvent(new CustomEvent("sidebar-action", { detail: "sidebar:createFolder" }));
      }
      if (e.detail === "file:open") {
        onOpenFolder();
      }
    };

    window.addEventListener("menu-action", handleMenuAction as EventListener);
    return () => {
      window.removeEventListener("menu-action", handleMenuAction as EventListener);
    };
  }, [onOpenFolder]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopMenu />

      <Toolbar
        onCreateFile={onCreateFile}
        theme={themeName}
        setTheme={setThemeName}
        onOpenThemeManager={() => setShowThemeManager((v) => !v)}
      />

      {showThemeManager && <ThemeManager />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0 }}>
        {sidebarVisible ? (
          <Sidebar
            tree={tree}
            sidebarVisible={sidebarVisible}
            onOpenFile={onOpenFileFromTree}
            onRenameFile={onRenameFile}
            onOpenFolder={onOpenFolder}
            onCreateFile={onCreateFile}
            onToggleFolder={toggleFolder}
            onCreateFileFromContext={onCreateFileFromContext}
            onCreateFolderFromContext={onCreateFolderFromContext}
            onTrashFile={onTrashFile}
            onDeleteFile={onDeleteFile}
          />
        ) : (
          <div style={{ width: "250px", borderRight: "1px solid #333" }}>
            <TodoList />
          </div>
        )}

        {/* Zone Éditeur */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <TabsBar />

          <div
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}
          >
            <Suspense
              fallback={<div style={{ color: "white" }}>Chargement...</div>}
            >
              <LazyCodeEditor
                model={activeModel}
                theme={themeName}
                customTheme={currentTheme}
              />
            </Suspense>
          </div>
          {showTerminal && (
            <div
              style={{
                height: "200px",
                borderTop: "1px solid #333",
                background: "#0d0d0d",
                overflow: "auto",
              }}
            >
              <Terminal />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
