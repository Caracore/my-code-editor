import { FileNode } from "../../types/FileNode";
import "./TreeNode.css";
import { useState } from "react";

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
}: TreeNodeProps) {
  const isSelected = selectedPath === node.path;
  const isRenaming = renamingPath === node.path;

  const [tempName, setTempName] = useState(node.name);

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

  return (
    <div
      style={{
        marginLeft: 12,
        border: isSelected ? "1px solid #4A90E2" : "1px solid transparent",
        borderRadius: 4,
        background: isSelected ? "rgba(74, 144, 226, 0.15)" : "transparent",
      }}
    >
      <div
        style={{ cursor: "pointer", padding: 2 }}
        onClick={() => {
          setSelectedPath(node.path);
          if (node.isDir) onToggle(node);
          else onOpenFile(node.path);
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

      {node.expanded &&
        node.children?.map((child: FileNode) => (
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
          />
        ))}
    </div>
  );
}
