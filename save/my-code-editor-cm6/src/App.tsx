import React, { useState } from "react";
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



  return (
    <TerminalProvider>
      <SettingsProvider>
        <MainLayout
          tree={tree}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
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
