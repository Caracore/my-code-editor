import { useEffect, useRef, useState } from "react";
import "./Sidebar.css";
import { I } from "./Icons";
import { useWorkspace } from "../context/WorkspaceContext";
import { useTabs } from "../context/TabsContext";
import type { FileNode } from "../types/FileNode";

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
  py: "var(--green)",
};

function extOf(name: string): string | undefined {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : undefined;
}

function FileExt({ ext }: { ext?: string }) {
  const color = (ext && extColor[ext]) || "var(--text-2)";
  return (
    <span className="file-ext-dot" style={{ background: color }} aria-hidden />
  );
}

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
}

function TreeNodeRow({
  node,
  depth,
  onSelect,
  onContext,
  selected,
  renamingPath,
  onCommitRename,
  onCancelRename,
}: {
  node: FileNode;
  depth: number;
  onSelect: (n: FileNode) => void;
  onContext: (e: React.MouseEvent, n: FileNode) => void;
  selected: string | null;
  renamingPath: string | null;
  onCommitRename: (oldPath: string, newName: string) => void;
  onCancelRename: () => void;
}) {
  const { toggleFolder, handleOpenFileFromTree } = useWorkspace();
  const [renameValue, setRenameValue] = useState(node.name);

  useEffect(() => {
    if (renamingPath === node.path) setRenameValue(node.name);
  }, [renamingPath, node.path, node.name]);

  const isFolder = node.isDir;
  const ext = extOf(node.name);
  const isSelected = selected === node.path;
  const isRenaming = renamingPath === node.path;

  const onClick = async () => {
    onSelect(node);
    if (isFolder) {
      await toggleFolder(node);
    } else {
      await handleOpenFileFromTree(node.path);
    }
  };

  return (
    <div>
      <div
        className={`tree__row ${isFolder ? "is-folder" : ""} ${
          isSelected ? "is-active" : ""
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={onClick}
        onContextMenu={(e) => onContext(e, node)}
        draggable={!isFolder}
        onDragStart={(e) => {
          if (!isFolder) e.dataTransfer.setData("text/plain", node.path);
        }}
      >
        {isFolder ? (
          node.expanded ? (
            <I.ChevronDown size={12} className="tree__chev" />
          ) : (
            <I.ChevronRight size={12} className="tree__chev" />
          )
        ) : (
          <span className="tree__chev tree__chev--placeholder" />
        )}
        {isFolder ? (
          node.expanded ? (
            <I.FolderOpen
              size={14}
              className="tree__icon tree__icon--folder"
            />
          ) : (
            <I.Folder size={14} className="tree__icon tree__icon--folder" />
          )
        ) : (
          <FileExt ext={ext} />
        )}
        {isRenaming ? (
          <input
            className="tree__rename-input"
            autoFocus
            value={renameValue}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommitRename(node.path, renameValue);
              if (e.key === "Escape") onCancelRename();
            }}
            onBlur={() => onCommitRename(node.path, renameValue)}
          />
        ) : (
          <span className="tree__name">{node.name}</span>
        )}
      </div>
      {isFolder &&
        node.expanded &&
        node.children?.map((c) => (
          <TreeNodeRow
            key={c.path}
            node={c}
            depth={depth + 1}
            onSelect={onSelect}
            onContext={onContext}
            selected={selected}
            renamingPath={renamingPath}
            onCommitRename={onCommitRename}
            onCancelRename={onCancelRename}
          />
        ))}
    </div>
  );
}

export default function Sidebar() {
  const {
    tree,
    handleOpenFolder,
    handleRenameFile,
    handleTrashFile,
    handleDeleteFile,
    onCreateFileFromContext,
    onCreateFolderFromContext,
    reloadTreeWithState,
  } = useWorkspace();
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(
    null,
  );
  const [creatingName, setCreatingName] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2" && selectedPath) {
        setRenamingPath(selectedPath);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedPath]);

  const onContext = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const onCommitRename = async (oldPath: string, newName: string) => {
    if (newName && newName !== oldPath.split(/[\\/]/).pop()) {
      await handleRenameFile(oldPath, newName);
    }
    setRenamingPath(null);
  };

  const startCreating = async (type: "file" | "folder") => {
    if (tree.length === 0) {
      await handleOpenFolder();
      return;
    }
    setCreatingType(type);
    setCreatingName("");
    setTimeout(() => newInputRef.current?.focus(), 0);
  };

  const commitCreate = async () => {
    if (!creatingName.trim() || !creatingType) {
      setCreatingType(null);
      return;
    }
    const targetFolder = tree[0]?.path || ".";
    if (creatingType === "file") {
      await onCreateFileFromContext(targetFolder, creatingName.trim());
    } else {
      await onCreateFolderFromContext(targetFolder, creatingName.trim());
    }
    setCreatingType(null);
    setCreatingName("");
  };

  const projectName =
    tree.length > 0 ? tree[0].name : "MY-CODE-EDITOR-RELOOKING";

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span className="sidebar__title">Explorer</span>
        <div className="sidebar__actions">
          <button
            className="iconbtn"
            title="New File"
            onClick={() => startCreating("file")}
          >
            <I.Plus size={14} />
          </button>
          <button
            className="iconbtn"
            title="Open Folder"
            onClick={() => handleOpenFolder()}
          >
            <I.Folder size={14} />
          </button>
          <button
            className="iconbtn"
            title="Refresh"
            onClick={() => reloadTreeWithState()}
          >
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
          {tabs.length === 0 && (
            <div className="tree__row tree__row--muted">
              <span className="tree__chev tree__chev--placeholder" />
              <span className="tree__name">No open editors</span>
            </div>
          )}
          {tabs.map((t) => {
            const ext = extOf(t.name);
            const active = activeTab === t.path;
            return (
              <div
                key={t.path}
                className={`tree__row ${active ? "is-active" : ""}`}
                onClick={() => setActiveTab(t.path)}
              >
                <span className="tree__chev tree__chev--placeholder" />
                <FileExt ext={ext} />
                <span className="tree__name">{t.name}</span>
                <span
                  className="tree__close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.path);
                  }}
                >
                  {t.isDirty ? (
                    <span className="tab__dirty" />
                  ) : (
                    <I.Close size={11} />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar__section sidebar__section--grow">
        <button className="sidebar__section-header">
          <I.ChevronDown size={12} />
          <span>{projectName.toUpperCase()}</span>
        </button>
        <div className="sidebar__tree">
          {tree.length === 0 ? (
            <div style={{ padding: "8px 12px" }}>
              <button
                className="iconbtn"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  background: "var(--bg-3)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-1)",
                }}
                onClick={() => handleOpenFolder()}
              >
                Open Folder…
              </button>
            </div>
          ) : (
            tree.map((n) => (
              <TreeNodeRow
                key={n.path}
                node={n}
                depth={0}
                onSelect={(node) => setSelectedPath(node.path)}
                onContext={onContext}
                selected={selectedPath}
                renamingPath={renamingPath}
                onCommitRename={onCommitRename}
                onCancelRename={() => setRenamingPath(null)}
              />
            ))
          )}

          {creatingType && (
            <div
              className="tree__row"
              style={{ paddingLeft: 8 + 14 }}
            >
              <span className="tree__chev tree__chev--placeholder" />
              {creatingType === "folder" ? (
                <I.Folder size={14} className="tree__icon tree__icon--folder" />
              ) : (
                <FileExt />
              )}
              <input
                ref={newInputRef}
                className="tree__rename-input"
                value={creatingName}
                onChange={(e) => setCreatingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitCreate();
                  if (e.key === "Escape") setCreatingType(null);
                }}
                onBlur={commitCreate}
                placeholder={
                  creatingType === "file" ? "filename.ext" : "folder name"
                }
              />
            </div>
          )}
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

      {contextMenu && (
        <div
          className="sidebar__context-menu"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-md)",
            zIndex: 1000,
            minWidth: 180,
            padding: "4px 0",
            color: "var(--text-1)",
            fontSize: 12,
          }}
        >
          {contextMenu.node.isDir && (
            <>
              <div
                className="ctx-menu-item"
                onClick={async () => {
                  const name = window.prompt("Nom du nouveau fichier :");
                  if (name)
                    await onCreateFileFromContext(contextMenu.node.path, name);
                  setContextMenu(null);
                }}
                style={{ padding: "6px 12px", cursor: "pointer" }}
              >
                New File
              </div>
              <div
                className="ctx-menu-item"
                onClick={async () => {
                  const name = window.prompt("Nom du nouveau dossier :");
                  if (name)
                    await onCreateFolderFromContext(
                      contextMenu.node.path,
                      name,
                    );
                  setContextMenu(null);
                }}
                style={{ padding: "6px 12px", cursor: "pointer" }}
              >
                New Folder
              </div>
              <div className="divider-h" style={{ margin: "4px 0" }} />
            </>
          )}
          <div
            className="ctx-menu-item"
            onClick={() => {
              setRenamingPath(contextMenu.node.path);
              setContextMenu(null);
            }}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Rename
          </div>
          <div
            className="ctx-menu-item"
            onClick={async () => {
              await handleTrashFile(contextMenu.node.path);
              setContextMenu(null);
            }}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Move to Trash
          </div>
          <div
            className="ctx-menu-item"
            onClick={async () => {
              await handleDeleteFile(contextMenu.node.path);
              setContextMenu(null);
            }}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              color: "var(--danger)",
            }}
          >
            Delete Permanently
          </div>
        </div>
      )}
    </aside>
  );
}

