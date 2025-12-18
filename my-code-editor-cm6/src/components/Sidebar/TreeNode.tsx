// import { FileNode } from "../../types/FileNode";
import type { FileNode } from "../../types/FileNode";
import "./TreeNode.css";
import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface TreeNodeProps {
  node: FileNode;
  onToggle: (node: FileNode) => void;
  onOpenFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  selectedPath: string | null;
  setSelectedPath: (path: string) => void;
  renamingPath: string | null;
  setRenamingPath: (path: string | null) => void;
  setContextMenu: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      path: string;
      isDir: boolean;
    } | null>
  >;
  draggedPath: string | null;
  setDraggedPath: (path: string | null) => void;
  onMoveFile: (sourcePath: string, targetPath: string, targetIsDir: boolean) => void;
  creatingFromContext: { folder: string; type: "file" | "folder" } | null;
  setCreatingFromContext: (value: { folder: string; type: "file" | "folder" } | null) => void;
  onCreateFileFromContext: (folder: string, name: string) => void;
  onCreateFolderFromContext: (folder: string, name: string) => void;
}

export default function TreeNode({
  node,
  onToggle,
  onOpenFile,
  onRenameFile,
  selectedPath,
  setSelectedPath,
  renamingPath,
  setRenamingPath,
  setContextMenu,
  draggedPath,
  setDraggedPath,
  onMoveFile,
  creatingFromContext,
  setCreatingFromContext,
  onCreateFileFromContext,
  onCreateFolderFromContext,
}: TreeNodeProps) {
  const isSelected = selectedPath === node.path;
  const isRenaming = renamingPath === node.path;
  const [tempName, setTempName] = useState(node.name);

  // dnd-kit hooks avec métadonnées de type
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.path,
    disabled: isRenaming,
    data: { 
      node,
      type: node.isDir ? "folder" : "file"
    }
  });

  // Utiliser PointerSensor avec contrainte de distance pour différencier click et drag
  const dragListeners = isRenaming ? {} : listeners;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.path,
    data: { 
      node,
      type: node.isDir ? "folder" : "file"
    }
  });

  const finishRename = () => {
    if (tempName.trim() && tempName !== node.name) {
      onRenameFile(node.path, tempName.trim());
    }
    setRenamingPath(null);
  };

  function getFileIcon(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "html":
        return "🌐";
      case "css":
        return "🎨";
      case "js":
        return "📜";
      case "ts":
        return "🔷";
      case "json":
        return "🧩";
      case "py":
        return "🐍";
      case "md":
        return "📝";
      default:
        return "📄";
    }
  }

  // Combiner les refs
  const combinedRef = (element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  return (
    <div
      ref={combinedRef}
      className="tree-node-wrapper"
      style={{
        marginLeft: 12,
        border: isSelected 
          ? `1px solid var(--sidebar-item-selected-border, #4A90E2)` 
          : "1px solid transparent",
        borderRadius: 4,
        background: isOver
          ? "var(--sidebar-item-drag-over-bg, rgba(74, 226, 144, 0.25))"
          : isSelected
          ? "var(--sidebar-item-selected-bg, rgba(74, 144, 226, 0.15))"
          : "transparent",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        {...attributes}
        {...dragListeners}
        className={`tree-node-content ${isDragging ? "dragging" : ""} ${isRenaming ? "renaming" : ""}`}
        onClick={(e) => {
          // Ne pas ouvrir pendant le drag
          if (isDragging) {
            e.preventDefault();
            return;
          }
          if (!isRenaming) {
            setSelectedPath(node.path);
            if (node.isDir) onToggle(node);
            else onOpenFile(node.path);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setSelectedPath(node.path);

          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            path: node.path,
            isDir: node.isDir,
          });
        }}
      >
        {isRenaming ? (
          <input
            autoFocus
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") finishRename();
              if (e.key === "Escape") setRenamingPath(null);
            }}
            onBlur={finishRename}
            className="sidebar-input"
            style={{ fontSize: 12 }}
          />
        ) : (
          <>
            {node.isDir
              ? node.expanded
                ? "📂"
                : "📁"
              : getFileIcon(node.name)}{" "}
            {node.name}
            <button
              style={{ marginLeft: 8, fontSize: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                setRenamingPath(node.path);
              }}
            >
              Renommer
            </button>
          </>
        )}
      </div>

      {node.expanded && (
        <>
          {/* Afficher l'input de création si c'est pour ce dossier */}
          {creatingFromContext && creatingFromContext.folder === node.path && (
            <div style={{ marginLeft: 12, marginTop: 4, marginBottom: 4 }}>
              <input
                autoFocus
                placeholder={
                  creatingFromContext.type === "file"
                    ? "Nouveau fichier..."
                    : "Nouveau dossier..."
                }
                className="sidebar-input"
                style={{ fontSize: 12, width: "90%" }}
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

          {node.children?.map((child: FileNode) => (
            <TreeNode
              key={child.path}
              node={child}
              onToggle={onToggle}
              onOpenFile={onOpenFile}
              onRenameFile={onRenameFile}
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
              renamingPath={renamingPath}
              setRenamingPath={setRenamingPath}
              setContextMenu={setContextMenu}
              draggedPath={draggedPath}
              setDraggedPath={setDraggedPath}
              onMoveFile={onMoveFile}
              creatingFromContext={creatingFromContext}
              setCreatingFromContext={setCreatingFromContext}
              onCreateFileFromContext={onCreateFileFromContext}
              onCreateFolderFromContext={onCreateFolderFromContext}
            />
          ))}
        </>
      )}
    </div>
  );
}
