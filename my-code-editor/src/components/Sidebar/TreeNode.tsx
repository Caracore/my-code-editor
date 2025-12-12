import { FileNode } from "../../types/FileNode";
import { useState } from "react";
import "./TreeNode.css";

interface TreeNodeProps {
  node: FileNode;
  onToggle: (node: FileNode) => void;
  onOpenFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  selectedPath: string | null;
  setSelectedPath: (path: string) => void;
}

export default function TreeNode({
  node,
  onToggle,
  onOpenFile,
  onRenameFile,
  selectedPath,
  setSelectedPath,
}: TreeNodeProps) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const isSelected = selectedPath === node.path;
  function getFileIcon(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "html":
        return "🌐"; // ou une icône HTML personnalisée
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
      >
        {/*{node.isDir ? (node.expanded ? "📂" : "📁") : "📄"} {node.name}*/}
        {renaming ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRenameFile(node.path, newName.trim());
                setRenaming(false);
              }
              if (e.key === "Escape") {
                setRenaming(false);
              }
            }}
            onBlur={() => setRenaming(false)}
            style={{
              padding: 2,
              background: "#333",
              color: "white",
              border: "1px solid #555",
              fontSize: 12,
            }}
          />
        ) : (
          <>
            {/*{node.isDir ? (node.expanded ? "📂" : "📁") : "📄"} {node.name}*/}
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
                setRenaming(true);
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
          />
        ))}
    </div>
  );
}
