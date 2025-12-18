import { useState, useEffect } from "react";
import type { FileNode } from "../../types/FileNode";
import TreeNode from "./TreeNode";
import "./Sidebar.css";
import ContextMenu from "./ContextMenu";
import { useTabs } from "../../context/TabsContext.tsx";
import { invoke } from "@tauri-apps/api/core";

interface SidebarProps {
  tree: FileNode[];
  sidebarVisible: boolean;
  onRenameFile: (oldPath: string, newName: string) => void;
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
  onToggleFolder: (node: FileNode) => void;
  onCreateFile: (name: string) => void;
  onTrashFile: (path: string) => Promise<boolean>;
  onDeleteFile: (path: string) => Promise<boolean>;
  onCreateFileFromContext: (folder: string, name: string) => void;
  onCreateFolderFromContext: (folder: string, name: string) => void;
  onReloadTree: () => void;
}

export default function Sidebar({
  tree,
  sidebarVisible,
  onRenameFile,
  onOpenFolder,
  onOpenFile,
  onToggleFolder,
  onCreateFile,
  onTrashFile,
  onDeleteFile,
  onCreateFileFromContext,
  onCreateFolderFromContext,
  onReloadTree,
}: SidebarProps) {
  const { openTab } = useTabs();
  console.log("Sidebar openTab ===", openTab);

  const [creating, setCreating] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    isDir: boolean;
  } | null>(null);
  const [creatingFromContext, setCreatingFromContext] = useState<{
    folder: string;
    type: "file" | "folder";
  } | null>(null);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "F2" && selectedPath) {
        setRenamingPath(selectedPath);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPath]);

  useEffect(() => {
    const handleCreateAction = (e: CustomEvent) => {
      if (e.detail === "sidebar:createFile") {
        if (selectedPath) {
          setCreatingFromContext({ folder: selectedPath, type: "file" });
        } else {
          setCreating(true);
        }
      }
      if (e.detail === "sidebar:createFolder") {
        if (selectedPath) {
          setCreatingFromContext({ folder: selectedPath, type: "folder" });
        } else {
          setCreatingFolder(true);
        }
      }
    };

    window.addEventListener("sidebar-action", handleCreateAction as EventListener);
    return () =>
      window.removeEventListener("sidebar-action", handleCreateAction as EventListener);
  }, [selectedPath]);

  function handleMoveFile(
    sourcePath: string,
    targetPath: string,
    targetIsDir: boolean
  ) {
    // Éviter de déplacer un fichier sur lui-même
    if (sourcePath === targetPath) {
      console.log("⚠️ Source et destination identiques");
      return;
    }

    // Éviter de déplacer un dossier dans lui-même
    if (targetIsDir && targetPath.startsWith(sourcePath)) {
      console.log("⚠️ Impossible de déplacer un dossier dans lui-même");
      return;
    }

    const fileName = sourcePath.split(/[/\\]/).pop() || "";
    let newPath: string;

    // Détecter le séparateur utilisé dans le système
    const separator = sourcePath.includes("/") ? "/" : "\\";

    if (targetIsDir) {
      // Déposer dans un dossier
      newPath = `${targetPath}${
        targetPath.endsWith(separator) ? "" : separator
      }${fileName}`;
    } else {
      // Déposer à côté d'un fichier (même dossier parent)
      const targetParts = targetPath.split(/[/\\]/);
      targetParts.pop();
      const parentPath = targetParts.join(separator);
      newPath = `${parentPath}${separator}${fileName}`;
    }

    // Vérifier si la destination est différente
    if (sourcePath === newPath) {
      console.log("⚠️ Le fichier est déjà à cet emplacement");
      return;
    }

    console.log(`🔄 Déplacement: ${sourcePath} → ${newPath}`);

    invoke("rename_file", { oldPath: sourcePath, newPath })
      .then(() => {
        console.log(`✅ Déplacé avec succès: ${newPath}`);
        // Recharger l'arbre en préservant l'état expanded
        onReloadTree();
      })
      .catch((err) => {
        console.error("❌ Erreur lors du déplacement:", err);
        alert(`Erreur lors du déplacement: ${err}`);
      });
  }

  // Gérer le déplacement de fichiers (appelé depuis MainLayout via handleGlobalDragEnd)
  useEffect(() => {
    const handleDragComplete = (event: any) => {
      const { sourcePath, targetPath, targetIsDir } = event.detail;
      if (sourcePath && targetPath) {
        handleMoveFile(sourcePath, targetPath, targetIsDir);
      }
    };
    
    window.addEventListener("sidebar-move-file", handleDragComplete);
    return () => window.removeEventListener("sidebar-move-file", handleDragComplete);
  }, []);

  return (
      <div className={`sidebar ${sidebarVisible ? "" : "hidden"}`}>
      <button onClick={onOpenFolder}>Ouvrir un dossier</button>
      <button onClick={() => setCreating(true)}>Nouveau fichier</button>
      <button onClick={() => setCreatingFolder(true)}>Nouveau dossier</button>

      {creating && (
        <div style={{ marginTop: 8, marginLeft: 8 }}>
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (newFileName.trim()) {
                  onCreateFile(newFileName.trim());
                }
                setNewFileName("");
                setCreating(false);
              }
              if (e.key === "Escape") {
                setNewFileName("");
                setCreating(false);
              }
            }}
            onBlur={() => {
              setNewFileName("");
              setCreating(false);
            }}
            placeholder="Nom du fichier..."
            className="sidebar-input"
          />
        </div>
      )}

      {creatingFolder && (
        <div style={{ marginTop: 8, marginLeft: 8 }}>
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (newFolderName.trim()) {
                  onCreateFolderFromContext(".", newFolderName.trim());
                }
                setNewFolderName("");
                setCreatingFolder(false);
              }
              if (e.key === "Escape") {
                setNewFolderName("");
                setCreatingFolder(false);
              }
            }}
            onBlur={() => {
              setNewFolderName("");
              setCreatingFolder(false);
            }}
            placeholder="Nom du dossier..."
            className="sidebar-input"
          />
        </div>
      )}

      {contextMenu && (
        <>
          <div
            className="context-backdrop"
            onClick={() => setContextMenu(null)}
          />

          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            path={contextMenu.path}
            isDir={contextMenu.isDir}
            onRename={() => {
              setRenamingPath(contextMenu.path);
              setContextMenu(null);
            }}
            onTrash={async () => {
              const success = await onTrashFile(contextMenu.path);
              if (success) {
                setContextMenu(null);
              }
            }}
            onDelete={async () => {
              const success = await onDeleteFile(contextMenu.path);
              if (success) {
                setContextMenu(null);
              }
            }}
            onCreateFile={() => {
              const folder = contextMenu.path;
              setContextMenu(null);
              setCreatingFromContext({ folder, type: "file" });
            }}
            onCreateFolder={() => {
              const folder = contextMenu.path;
              setContextMenu(null);
              setCreatingFromContext({ folder, type: "folder" });
            }}
            onClose={() => setContextMenu(null)}
          />
        </>
      )}

      {tree.map((node: FileNode) => (
        <TreeNode
          key={node.path}
          node={node}
          onToggle={onToggleFolder}
          onOpenFile={onOpenFile}
          onRenameFile={onRenameFile}
          selectedPath={selectedPath}
          setSelectedPath={setSelectedPath}
          renamingPath={renamingPath}
          setRenamingPath={setRenamingPath}
          setContextMenu={setContextMenu}
          draggedPath={draggedPath}
          setDraggedPath={setDraggedPath}
          onMoveFile={handleMoveFile}
          creatingFromContext={creatingFromContext}
          setCreatingFromContext={setCreatingFromContext}
          onCreateFileFromContext={onCreateFileFromContext}
          onCreateFolderFromContext={onCreateFolderFromContext}
        />
      ))}
      </div>
  );
}
