import { useState } from "react";
import { FileNode } from "../../types/FileNode";
import TreeNode from "./TreeNode";
import "./Sidebar.css";

interface SidebarProps {
  tree: FileNode[];
  onRenameFile: (oldPath: string, newName: string) => void;
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
  onToggleFolder: (node: FileNode) => void;
  onCreateFile: (name: string) => void;
}

export default function Sidebar({
  tree,
  onRenameFile,
  onOpenFolder,
  onOpenFile,
  onToggleFolder,
  onCreateFile,
}: SidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // ✅ La sélection est gérée ici, pas en props
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="sidebar">
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

      {tree.map((node: FileNode) => (
        <TreeNode
          key={node.path}
          node={node}
          onToggle={onToggleFolder}
          onOpenFile={onOpenFile}
          onRenameFile={onRenameFile}
          selectedPath={selectedPath}
          setSelectedPath={setSelectedPath}
        />
      ))}
    </div>
  );
}
