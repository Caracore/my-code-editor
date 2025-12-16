import React, { useState, useEffect } from "react";
import MainLayout from "./layout/MainLayout";
import { ThemeProvider } from "./context/ThemeContext";
import { TabsProvider } from "./context/TabsContext";
import { FileNode } from "./types/FileNode";
import { useFileTree } from "./hooks/useFileTree";
import { useFileSystem } from "./hooks/useFileSystem";
import { TerminalProvider } from "./context/TerminalContext";

const LazyCodeEditor = React.lazy(
  () => import("./components/Editor/CodeEditor"),
);

export default function App() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);

  const { loadFolder, toggleFolder } = useFileTree();
  const handleToggleFolder = (node: FileNode) => {
    toggleFolder(node, tree, setTree);
  };

  const {
    // refreshTree,
    handleRenameFile,
    handleCreateFile,
    handleOpenFileFromTree,
    handleOpenFolder,
    onCreateFileFromContext,
    onCreateFolderFromContext,
  } = useFileSystem({
    tree,
    setTree,
    currentPath,
    setCurrentPath,
    loadFolder,
  });

  // ✅ Sidebar toggle via menu
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === "view:toggleSidebar") {
        setSidebarVisible((v) => !v);
      }
    };
    window.addEventListener("menu-action", handler);
    return () => window.removeEventListener("menu-action", handler);
  }, []);

  return (
    <ThemeProvider>
      <TabsProvider>
        <TerminalProvider>
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
          />
        </TerminalProvider>
      </TabsProvider>
    </ThemeProvider>
  );
}
