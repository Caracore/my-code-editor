import { FileNode } from "../../types/FileNode";

interface TreeNodeProps {
  node: FileNode;
  onToggle: (node: FileNode) => void;
  onOpenFile: (path: string) => void;
}

export default function TreeNode({
  node,
  onToggle,
  onOpenFile,
}: TreeNodeProps) {
  return (
    <div style={{ marginLeft: 12 }}>
      <div
        style={{ cursor: "pointer", padding: 2 }}
        onClick={() => {
          if (node.isDir) onToggle(node);
          else onOpenFile(node.path);
        }}
      >
        {node.isDir ? (node.expanded ? "📂" : "📁") : "📄"} {node.name}
      </div>

      {node.expanded &&
        node.children?.map((child: FileNode) => (
          <TreeNode
            key={child.path}
            node={child}
            onToggle={onToggle}
            onOpenFile={onOpenFile}
          />
        ))}
    </div>
  );
}
