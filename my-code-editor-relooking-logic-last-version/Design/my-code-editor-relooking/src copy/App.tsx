import React, { useState, useEffect, useRef } from "react";
import MainLayout from "./layout/MainLayout";
import { ThemeProvider } from "./context/ThemeContext";
import { TerminalProvider } from "./context/TerminalContext";
import { SettingsProvider } from "./context/SettingsContext"; // useSettingsContext
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
  const treeRef = useRef<FileNode[]>(tree);

  // Mettre à jour la ref à chaque changement de tree
  useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  // ✅ Accès au contexte des onglets
  const { closeTab, openTab, tabs } = useTabs();

  // ✅ Gestion du tree (ouvrir dossier, toggle)
  const { loadFolder, toggleFolder } = useFileTree();
  const handleToggleFolder = (node: FileNode) => {
    toggleFolder(node, tree, setTree);
  };

  // ✅ Fonction pour recharger l'arbre en préservant l'état expanded
  const reloadTreeWithState = async () => {
    console.log("🔄 reloadTreeWithState appelé");
    console.log("📂 currentPath:", currentPath);
    console.log("📂 tree:", treeRef.current);
    
    // Utiliser le chemin racine de l'arbre si currentPath est null
    const rootPath = currentPath || (treeRef.current.length > 0 ? treeRef.current[0].path : null);
    
    if (!rootPath) {
      console.warn("⚠️ Aucun chemin racine trouvé, abandon du rechargement");
      return;
    }
    
    console.log("🔄 Rechargement de l'arbre depuis:", rootPath);
    console.log("📂 Tree avant:", treeRef.current);
    
    // Collecter tous les chemins expanded
    const expandedPaths = new Set<string>();
    const collectExpandedPaths = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.expanded) {
          expandedPaths.add(node.path);
        }
        if (node.children) {
          collectExpandedPaths(node.children);
        }
      });
    };
    collectExpandedPaths(treeRef.current);
    console.log("📂 Chemins expanded collectés:", Array.from(expandedPaths));

    // Charger le nouveau tree depuis le dossier racine
    const children = await loadFolder(rootPath);
    const newTree = [
      {
        path: rootPath,
        name: rootPath.split(/[/\\]/).pop()!,
        isDir: true,
        expanded: true,
        children,
      },
    ];
    console.log("📂 newTree chargé:", newTree);
    
    // Appliquer l'état expanded au nouveau tree
    const applyExpandedState = async (nodes: FileNode[]): Promise<FileNode[]> => {
      const result: FileNode[] = [];
      
      for (const node of nodes) {
        if (node.isDir && expandedPaths.has(node.path)) {
          console.log("📂 Ré-expansion du dossier:", node.path);
          // Recharger les enfants de ce dossier
          const children = await loadFolder(node.path);
          // Appliquer récursivement l'état expanded aux enfants
          const expandedChildren = await applyExpandedState(children);
          result.push({
            ...node,
            expanded: true,
            children: expandedChildren
          });
        } else {
          result.push(node);
        }
      }
      
      return result;
    };

    const mergedTree = await applyExpandedState(newTree);
    console.log("📂 mergedTree final:", mergedTree);
    console.log("✅ setTree appelé avec le nouveau tree");
    setTree(mergedTree);
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

  // 🎯 Goto-definition LSP : ouvrir le fichier puis positionner le curseur
  const tabsRef = useRef(tabs);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const custom = e as CustomEvent<{ path: string; line: number; character: number }>;
      const detail = custom.detail;
      if (!detail) return;

      const dispatchPosition = () => {
        window.dispatchEvent(
          new CustomEvent("editor:goto-position", {
            detail,
          })
        );
      };

      const alreadyOpen = tabsRef.current.some((t) => t.path === detail.path);
      if (alreadyOpen) {
        dispatchPosition();
        // Petit délai si l'onglet existe mais n'est pas actif (re-render)
        setTimeout(dispatchPosition, 50);
        return;
      }

      try {
        await handleOpenFileFromTree(detail.path);
        // Laisser le temps à l'éditeur de monter et listener
        setTimeout(dispatchPosition, 100);
      } catch (err) {
        console.error("[App] goto-definition: failed to open file", detail.path, err);
      }
    };
    window.addEventListener("lsp:goto-definition", handler as EventListener);
    return () => window.removeEventListener("lsp:goto-definition", handler as EventListener);
  }, [handleOpenFileFromTree]);



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
            onReloadTree={reloadTreeWithState}
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
