import "./Sidebar.css";
import { I } from "./Icons";

type Node = {
  name: string;
  type: "folder" | "file";
  open?: boolean;
  status?: "M" | "A" | "U";
  ext?: string;
  children?: Node[];
};

const tree: Node[] = [
  {
    name: "src",
    type: "folder",
    open: true,
    children: [
      {
        name: "components",
        type: "folder",
        open: true,
        children: [
          { name: "TitleBar.tsx", type: "file", ext: "tsx" },
          { name: "Sidebar.tsx", type: "file", ext: "tsx", status: "M" },
          { name: "EditorArea.tsx", type: "file", ext: "tsx" },
          { name: "StatusBar.tsx", type: "file", ext: "tsx" },
        ],
      },
      {
        name: "styles",
        type: "folder",
        children: [
          { name: "global.css", type: "file", ext: "css" },
          { name: "layout.css", type: "file", ext: "css" },
        ],
      },
      { name: "App.tsx", type: "file", ext: "tsx", status: "M" },
      { name: "main.tsx", type: "file", ext: "tsx" },
    ],
  },
  {
    name: "src-tauri",
    type: "folder",
    children: [
      { name: "tauri.conf.json", type: "file", ext: "json" },
      { name: "Cargo.toml", type: "file", ext: "toml" },
    ],
  },
  { name: "index.html", type: "file", ext: "html" },
  { name: "package.json", type: "file", ext: "json", status: "A" },
  { name: "vite.config.ts", type: "file", ext: "ts" },
  { name: "README.md", type: "file", ext: "md" },
];

const extColor: Record<string, string> = {
  tsx: "var(--cyan)",
  ts: "var(--accent)",
  jsx: "var(--cyan)",
  js: "var(--warning)",
  css: "var(--magenta)",
  json: "var(--orange)",
  md: "var(--text-1)",
  html: "var(--orange)",
  toml: "var(--text-2)",
  rs: "var(--orange)",
};

function FileIcon({ ext }: { ext?: string }) {
  const color = (ext && extColor[ext]) || "var(--text-2)";
  return (
    <span className="file-ext-dot" style={{ background: color }} aria-hidden />
  );
}

function TreeNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const isFolder = node.type === "folder";
  return (
    <div>
      <div
        className={`tree__row ${isFolder ? "is-folder" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {isFolder ? (
          node.open ? (
            <I.ChevronDown size={12} className="tree__chev" />
          ) : (
            <I.ChevronRight size={12} className="tree__chev" />
          )
        ) : (
          <span className="tree__chev tree__chev--placeholder" />
        )}
        {isFolder ? (
          node.open ? (
            <I.FolderOpen size={14} className="tree__icon tree__icon--folder" />
          ) : (
            <I.Folder size={14} className="tree__icon tree__icon--folder" />
          )
        ) : (
          <FileIcon ext={node.ext} />
        )}
        <span className="tree__name">{node.name}</span>
        {node.status && (
          <span className={`tree__status tree__status--${node.status}`}>
            {node.status}
          </span>
        )}
      </div>
      {isFolder && node.open && node.children?.map((c) => (
        <TreeNode key={c.name} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span className="sidebar__title">Explorer</span>
        <div className="sidebar__actions">
          <button className="iconbtn" title="New File">
            <I.Plus size={14} />
          </button>
          <button className="iconbtn" title="More">
            <I.More size={14} />
          </button>
        </div>
      </div>

      <div className="sidebar__section">
        <button className="sidebar__section-header">
          <I.ChevronDown size={12} />
          <span>OPEN EDITORS</span>
        </button>
        <div className="sidebar__open-list">
          <div className="tree__row is-active">
            <span className="tree__chev tree__chev--placeholder" />
            <FileIcon ext="tsx" />
            <span className="tree__name">App.tsx</span>
            <span className="tree__close"><I.Close size={11} /></span>
          </div>
          <div className="tree__row">
            <span className="tree__chev tree__chev--placeholder" />
            <FileIcon ext="css" />
            <span className="tree__name">global.css</span>
          </div>
        </div>
      </div>

      <div className="sidebar__section sidebar__section--grow">
        <button className="sidebar__section-header">
          <I.ChevronDown size={12} />
          <span>MY-CODE-EDITOR-RELOOKING</span>
        </button>
        <div className="sidebar__tree">
          {tree.map((n) => (
            <TreeNode key={n.name} node={n} />
          ))}
        </div>
      </div>

      <div className="sidebar__section sidebar__section--outline">
        <button className="sidebar__section-header">
          <I.ChevronRight size={12} />
          <span>OUTLINE</span>
        </button>
      </div>

      <div className="sidebar__section sidebar__section--outline">
        <button className="sidebar__section-header">
          <I.ChevronRight size={12} />
          <span>TIMELINE</span>
        </button>
      </div>
    </aside>
  );
}
