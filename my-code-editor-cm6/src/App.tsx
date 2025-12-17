import React, { useState, useEffect } from "react";
import MainLayout from "./layout/MainLayout";
import { ThemeProvider } from "./context/ThemeContext";
import { TerminalProvider } from "./context/TerminalContext";
import { SettingsProvider } from "./context/SettingsContext";
import { TabsProvider, useTabs } from "./context/TabsContext";
import { useFileTree } from "./hooks/useFileTree";
import { useFileSystem } from "./hooks/useFileSystem";
import type { FileNode } from "./types/FileNode";

const LazyCodeEditor = React.lazy(
  () => import("./components/Editor/CodeEditorCM6") // ✅ nouvelle version CodeMirror
);

function AppContent() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);

  // ✅ Accès au contexte des onglets
  const { closeTab, openTab, tabs } = useTabs();

  // ✅ Gestion du tree (ouvrir dossier, toggle)
  const { loadFolder, toggleFolder } = useFileTree();
  const handleToggleFolder = (node: FileNode) => {
    toggleFolder(node, tree, setTree);
  };

  // ✅ Gestion du système de fichiers
  const {
    handleRenameFile,
    handleCreateFile,
    handleOpenFileFromTree,
    handleOpenFolder,
    onCreateFileFromContext,
    onCreateFolderFromContext,
    handleTrashFile,
    handleDeleteFile,
  } = useFileSystem({
    tree,
    setTree,
    currentPath,
    setCurrentPath,
    loadFolder,
    closeTab,
    openTab,
    tabs,
  });

  // ✅ Sidebar toggle via menu
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail === "view:toggleSidebar") {
        setSidebarVisible((v) => !v);
      }
    };

    window.addEventListener("menu-action", handler as EventListener);
    return () => window.removeEventListener("menu-action", handler as EventListener);
  }, []);

  return (
    <TerminalProvider>
      <SettingsProvider>
        <MainLayout
          tree={tree}
          sidebarVisible={sidebarVisible}
          onRenameFile={handleRenameFile}
          onCreateFile={handleCreateFile}
          onOpenFolder={handleOpenFolder}
          LazyCodeEditor={LazyCodeEditor}
          onOpenFileFromTree={handleOpenFileFromTree}
          toggleFolder={handleToggleFolder}
          onCreateFileFromContext={onCreateFileFromContext}
          onCreateFolderFromContext={onCreateFolderFromContext}
          onTrashFile={handleTrashFile}
          onDeleteFile={handleDeleteFile}
        />
      </SettingsProvider>
    </TerminalProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TabsProvider>
        <AppContent />
      </TabsProvider>
    </ThemeProvider>
  );
}
