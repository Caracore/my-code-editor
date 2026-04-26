import { useState } from "react";
import { I } from "./Icons";
import "./Sidebar.css";

type Node =
  | { kind: "folder"; name: string; open?: boolean; children: Node[] }
  | { kind: "file"; name: string; ext: string; status?: "M" | "A" | "U" };

const TREE: Node = {
  kind: "folder",
  name: "my-code-editor",
  open: true,
  children: [
    {
      kind: "folder", name: ".idea", open: false, children: [
        { kind: "file", name: "workspace.xml", ext: "xml" },
      ],
    },
    {
      kind: "folder", name: "src", open: true, children: [
        {
          kind: "folder", name: "components", open: true, children: [
            { kind: "file", name: "ActivityBar.tsx", ext: "tsx", status: "M" },
            { kind: "file", name: "EditorArea.tsx",  ext: "tsx", status: "M" },
            { kind: "file", name: "Sidebar.tsx",     ext: "tsx" },
            { kind: "file", name: "TitleBar.tsx",    ext: "tsx", status: "A" },
            { kind: "file", name: "Icons.tsx",       ext: "tsx" },
          ],
        },
        {
          kind: "folder", name: "styles", open: false, children: [
            { kind: "file", name: "theme.css",  ext: "css" },
            { kind: "file", name: "layout.css", ext: "css" },
          ],
        },
        { kind: "file", name: "App.tsx",  ext: "tsx" },
        { kind: "file", name: "main.tsx", ext: "tsx" },
      ],
    },
    {
      kind: "folder", name: "src-tauri", open: false, children: [
        { kind: "file", name: "Cargo.toml",   ext: "toml" },
        { kind: "file", name: "tauri.conf.json", ext: "json" },
      ],
    },
    { kind: "file", name: "package.json",  ext: "json" },
    { kind: "file", name: "tsconfig.json", ext: "json" },
    { kind: "file", name: "vite.config.ts",ext: "ts", status: "U" },
    { kind: "file", name: "README.md",     ext: "md" },
  ],
};

function FileGlyph({ ext }: { ext: string }) {
  const map: Record<string, [string, string]> = {
    tsx:  ["#1a73c4", "TSX"],
    ts:   ["#3178c6", "TS"],
    css:  ["#264de4", "CSS"],
    json: ["#8a8a8a", "{ }"],
    toml: ["#d34516", "TOM"],
    md:   ["#444",    "MD"],
    xml:  ["#558b2f", "XML"],
    rs:   ["#d34516", "RS"],
  };
  const [color, label] = map[ext] ?? ["#666", "···"];
  return <span className="file-glyph" style={{ background: color }}>{label}</span>;
}

function TreeNode({ node, depth, selected, onSelect }: {
  node: Node; depth: number; selected: string; onSelect: (p: string) => void;
}) {
  const [open, setOpen] = useState(node.kind === "folder" ? !!node.open : false);
  if (node.kind === "folder") {
    return (
      <div className="tree__node">
        <div
          className="tree__row tree__row--folder"
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`tree__chev ${open ? "is-open" : ""}`}><I.ChevronRight size={12} /></span>
          {open ? <I.FolderOpen size={14} /> : <I.Folder size={14} />}
          <span className="tree__label">{node.name}</span>
        </div>
        {open && (
          <div>
            {node.children.map((c) => (
              <TreeNode key={c.name} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  }
  const isSel = selected === node.name;
  return (
    <div
      className={`tree__row ${isSel ? "is-selected" : ""}`}
      style={{ paddingLeft: 8 + depth * 14 + 14 }}
      onClick={() => onSelect(node.name)}
    >
      <FileGlyph ext={node.ext} />
      <span className="tree__label">{node.name}</span>
      {node.status && <span className={`tree__status tree__status--${node.status}`}>{node.status}</span>}
    </div>
  );
}

export default function Sidebar() {
  const [selected, setSelected] = useState("EditorArea.tsx");

  return (
    <aside className="sidebar">
      <div className="panel-header">
        <span>Project</span>
        <div className="panel-header__actions">
          <button className="panel-header__btn" title="New File"><I.Plus size={13} /></button>
          <button className="panel-header__btn" title="Collapse all"><I.ChevronDown size={13} /></button>
          <button className="panel-header__btn" title="More"><I.More size={13} /></button>
        </div>
      </div>

      <div className="sidebar__search">
        <I.Search size={13} />
        <input placeholder="Search files…" />
        <kbd>Ctrl P</kbd>
      </div>

      <div className="sidebar__tree">
        <TreeNode node={TREE} depth={0} selected={selected} onSelect={setSelected} />
      </div>

      <div className="sidebar__footer">
        <I.Branch size={12} />
        <span>main</span>
        <span className="sidebar__footer-dot">•</span>
        <span className="sidebar__footer-mut">3 changes</span>
      </div>
    </aside>
  );
}
