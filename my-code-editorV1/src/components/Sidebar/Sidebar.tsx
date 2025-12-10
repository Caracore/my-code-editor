import { useState } from "react";
import { FileNode } from "../../types/FileNode";
import TreeNode from "./TreeNode";

interface SidebarProps {
  tree: FileNode[];
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
  onToggleFolder: (node: FileNode) => void;
  onCreateFile: (name: string) => void;
}

export default function Sidebar({
  tree,
  onOpenFolder,
  onOpenFile,
  onToggleFolder,
  onCreateFile,
}: SidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  return (
    <div
      style={{
        width: 250,
        background: "#1e1e1e",
        color: "#ccc",
        padding: 8,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
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
            style={{
              width: "90%",
              padding: 4,
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              fontSize: 12,
            }}
          />
        </div>
      )}
      {tree.map((node: FileNode) => (
        <TreeNode
          key={node.path}
          node={node}
          onToggle={onToggleFolder}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
}
