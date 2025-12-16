import { useState, useEffect } from "react";
import { FileNode } from "../../types/FileNode";
import TreeNode from "./TreeNode";
import "./Sidebar.css";
import ContextMenu from "./ContextMenu";
import { useTabs } from "../../context/TabsContext";

import { invoke } from "@tauri-apps/api/core";

interface SidebarProps {
  tree: FileNode[];
  sidebarVisible: boolean;
  onRenameFile: (oldPath: string, newName: string) => void;
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
  onToggleFolder: (node: FileNode) => void;
  onCreateFile: (name: string) => void;
  // onTrashFile: (path: string) => void;
  // onDeleteFile: (path: string) => void;
  onCreateFileFromContext: (folder: string, name: string) => void;
  onCreateFolderFromContext: (folder: string, name: string) => void;
}

export default function Sidebar({
  tree,
  sidebarVisible,
  onRenameFile,
  onOpenFolder,
  // onOpenFile,
  onToggleFolder,
  onCreateFile,
  // onTrashFile, // ✅ manquait !
  // onDeleteFile,
  onCreateFileFromContext,
  onCreateFolderFromContext,
}: SidebarProps) {
  const { openTab } = useTabs();
  console.log("Sidebar openTab ===", openTab);

  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
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

  // ✅ La sélection est gérée ici, pas en props
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
  function handleOpenFile(path: string) {
    invoke<string>("read_file", { path })
      .then((content) => {
        console.log("✅ openTab appelé avec :", path, content);
        openTab(path, content);
      })
      .catch((err) => console.error("Erreur lecture fichier:", err));
  }

  return (
    <div className={`sidebar ${sidebarVisible ? "" : "hidden"}`}>
      <button onClick={onOpenFolder}>Ouvrir un dossier</button>
      <button onClick={() => setCreating(true)}>Nouveau fichier</button>

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
            // onTrash={() => {
            //   const path = contextMenu.path;
            //   setContextMenu(null);
            //   setTimeout(() => onTrashFile(path), 0);
            // }}
            // onDelete={() => {
            //   const path = contextMenu.path;
            //   setContextMenu(null);
            //   setTimeout(() => {
            //     console.log("DELETE CALLBACK OK", path);
            //     onDeleteFile(path);
            //   }, 0);
            // }}
            onCreateFile={() => {
              const folder = contextMenu.path;
              setContextMenu(null);
              setCreatingFromContext({ folder, type: "file" });
              // setTimeout(() => onCreateFileFromContext(folder), 0);
            }}
            onCreateFolder={() => {
              const folder = contextMenu.path;
              setContextMenu(null);
              setCreatingFromContext({ folder, type: "folder" });
              // setTimeout(() => onCreateFolderFromContext(folder), 0);
            }}
            onClose={() => setContextMenu(null)}
          />
        </>
      )}
      {creatingFromContext && (
        <div style={{ marginTop: 8, marginLeft: 8 }}>
          <input
            autoFocus
            placeholder={
              creatingFromContext.type === "file"
                ? "Nouveau fichier..."
                : "Nouveau dossier..."
            }
            className="sidebar-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const name = e.currentTarget.value.trim();
                if (!name) return;

                if (creatingFromContext.type === "file") {
                  onCreateFileFromContext(creatingFromContext.folder, name);
                } else {
                  onCreateFolderFromContext(creatingFromContext.folder, name);
                }

                setCreatingFromContext(null);
              }

              if (e.key === "Escape") {
                setCreatingFromContext(null);
              }
            }}
            onBlur={() => setCreatingFromContext(null)}
          />
        </div>
      )}

      {tree.map((node: FileNode) => (
        <TreeNode
          key={node.path}
          node={node}
          onToggle={onToggleFolder}
          onOpenFile={handleOpenFile}
          onRenameFile={onRenameFile}
          selectedPath={selectedPath}
          setSelectedPath={setSelectedPath}
          renamingPath={renamingPath}
          setRenamingPath={setRenamingPath}
          setContextMenu={setContextMenu}
        />
      ))}
    </div>
  );
}
