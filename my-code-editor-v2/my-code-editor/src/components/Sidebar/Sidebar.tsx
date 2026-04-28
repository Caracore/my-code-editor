import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  createDir,
  createFile,
  deletePath,
  dirname,
  extOf,
  joinPath,
  movePath,
  readDir,
} from "../../services/fs";
import type { DirEntry } from "../../services/fs";
import ResizeHandle from "../ResizeHandle/ResizeHandle";
import ContextMenu, { type ContextMenuItem } from "../ContextMenu/ContextMenu";
import PromptDialog from "../PromptDialog/PromptDialog";
import TodoListView from "./TodoListView";
import DataBaseView from "./DataBaseView";
import "./Sidebar.css";

/** State driving the in-app prompt dialog (replaces `window.prompt`). */
interface PromptRequest {
  title: string;
  label?: string;
  initial?: string;
  okLabel?: string;
  resolve: (value: string | null) => void;
}

/** Target of an open context-menu request (or `null` for empty-area). */
interface MenuTarget {
  /** Absolute path the menu acts on. For files: the file. For folders: the folder. */
  path: string;
  /** Whether `path` points at a directory. */
  isDir: boolean;
  /** Whether this is the workspace root row. */
  isRoot?: boolean;
}

type OpenMenu = (e: React.MouseEvent, target: MenuTarget) => void;

/* ---------------------------------------------------------------- */
/*  Live tree backed by the real filesystem (lazy-loaded)           */
/* ---------------------------------------------------------------- */

interface TreeState {
  /** Cached directory listings, keyed by absolute folder path. */
  cache: Map<string, DirEntry[]>;
  /** Open folders, keyed by absolute path. */
  open: Set<string>;
  /** Folders currently being loaded. */
  loading: Set<string>;
}

function FileGlyph({ ext }: { ext: string }) {
  const map: Record<string, [string, string]> = {
    tsx:  ["#1a73c4", "TSX"],
    ts:   ["#3178c6", "TS"],
    jsx:  ["#1a73c4", "JSX"],
    js:   ["#f7df1e", "JS"],
    css:  ["#264de4", "CSS"],
    json: ["#8a8a8a", "{ }"],
    toml: ["#d34516", "TOM"],
    md:   ["#444",    "MD"],
    xml:  ["#558b2f", "XML"],
    rs:   ["#d34516", "RS"],
    py:   ["#3776ab", "PY"],
    cpp:  ["#00599c", "C++"],
    html: ["#e34f26", "HTML"],
  };
  const [color, label] = map[ext] ?? ["#666", "···"];
  return <span className="file-glyph" style={{ background: color }}>{label}</span>;
}

interface FolderViewProps {
  path: string;
  depth: number;
  state: TreeState;
  /** Force re-render when state mutates (refs are mutated in place). */
  bump: () => void;
  selectedPath: string | null;
  onFileClick: (entry: DirEntry) => void;
  onContextMenu: OpenMenu;
}

function FolderView({ path, depth, state, bump, selectedPath, onFileClick, onContextMenu }: FolderViewProps) {
  const entries = state.cache.get(path);
  if (!entries) {
    return (
      <div className="tree__loading" style={{ paddingLeft: 8 + depth * 14 + 14 }}>
        Loading…
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="tree__loading" style={{ paddingLeft: 8 + depth * 14 + 14 }}>
        (empty)
      </div>
    );
  }
  return (
    <>
      {entries.map((e) =>
        e.is_dir ? (
          <DirNode
            key={e.path}
            entry={e}
            depth={depth}
            state={state}
            bump={bump}
            selectedPath={selectedPath}
            onFileClick={onFileClick}
            onContextMenu={onContextMenu}
          />
        ) : (
          <FileNode
            key={e.path}
            entry={e}
            depth={depth}
            selected={selectedPath === e.path}
            onClick={() => onFileClick(e)}
            onContextMenu={onContextMenu}
          />
        )
      )}
    </>
  );
}

function DirNode({
  entry, depth, state, bump, selectedPath, onFileClick, onContextMenu,
}: {
  entry: DirEntry; depth: number; state: TreeState; bump: () => void;
  selectedPath: string | null; onFileClick: (entry: DirEntry) => void;
  onContextMenu: OpenMenu;
}) {
  const isOpen = state.open.has(entry.path);
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder::${entry.path}`,
    data: { type: "folder", path: entry.path },
  });

  const toggle = async () => {
    if (state.open.has(entry.path)) {
      state.open.delete(entry.path);
      bump();
      return;
    }
    state.open.add(entry.path);
    bump();
    if (!state.cache.has(entry.path)) {
      state.loading.add(entry.path);
      bump();
      try {
        const contents = await readDir(entry.path);
        state.cache.set(entry.path, contents);
      } catch (e) {
        console.error("readDir failed:", e);
        state.cache.set(entry.path, []);
      } finally {
        state.loading.delete(entry.path);
        bump();
      }
    }
  };

  return (
    <div className="tree__node">
      <div
        ref={setDropRef}
        className={`tree__row tree__row--folder ${isOver ? "is-drop-target" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={toggle}
        onContextMenu={(e) => onContextMenu(e, { path: entry.path, isDir: true })}
        title={entry.path}
      >
        <span className={`tree__chev ${isOpen ? "is-open" : ""}`}>
          <I.ChevronRight size={12} />
        </span>
        {isOpen ? <I.FolderOpen size={14} /> : <I.Folder size={14} />}
        <span className="tree__label">{entry.name}</span>
      </div>
      {isOpen && (
        <FolderView
          path={entry.path}
          depth={depth + 1}
          state={state}
          bump={bump}
          selectedPath={selectedPath}
          onFileClick={onFileClick}
          onContextMenu={onContextMenu}
        />
      )}
    </div>
  );
}

function FileNode({
  entry, depth, selected, onClick, onContextMenu,
}: {
  entry: DirEntry; depth: number; selected: boolean; onClick: () => void;
  onContextMenu: OpenMenu;
}) {
  const ext = extOf(entry.name);
  const {
    attributes, listeners, setNodeRef, isDragging,
  } = useDraggable({
    id: `file::${entry.path}`,
    data: { type: "file", path: entry.path, name: entry.name },
  });
  return (
    <div
      ref={setNodeRef}
      className={`tree__row ${selected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      style={{ paddingLeft: 8 + depth * 14 + 14 }}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, { path: entry.path, isDir: false })}
      title={entry.path}
      {...attributes}
      {...listeners}
    >
      <FileGlyph ext={ext} />
      <span className="tree__label">{entry.name}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Sidebar                                                         */
/* ---------------------------------------------------------------- */

interface SidebarProps {
  /** Which view to show in the sidebar body. Defaults to "files". */
  view?: "files" | "todo" | "db";
  onClose?: () => void;
  width?: number;
  onResize?: (w: number) => void;
}

export default function Sidebar({ view = "files", onClose, width, onResize }: SidebarProps = {}) {
  const { activeTab, openFile, openFolder, closeFolder, rootPath, rootName, tabs, closeTab } = useWorkspace();

  // Tree state — refs for in-place mutation, with a `tick` to re-render.
  const stateRef = useRef<TreeState>({
    cache: new Map(),
    open: new Set(),
    loading: new Set(),
  });
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const [search, setSearch] = useState("");

  // Context-menu state.
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    target: MenuTarget;
  } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  // In-app replacement for `window.prompt`. We store the active request
  // (with its resolver) in state so a single React-rendered dialog can
  // service every "new file / new folder / rename" call. The native
  // `localhost says…` prompt is gone.
  const [promptReq, setPromptReq] = useState<PromptRequest | null>(null);
  const askName = useCallback(
    (opts: { title: string; label?: string; initial?: string; okLabel?: string }) =>
      new Promise<string | null>((resolve) => {
        setPromptReq({ ...opts, resolve });
      }),
    [],
  );

  // Load root contents whenever the workspace folder changes
  useEffect(() => {
    if (!rootPath) {
      stateRef.current = { cache: new Map(), open: new Set(), loading: new Set() };
      bump();
      return;
    }
    const s = stateRef.current;
    s.cache.clear();
    s.open.clear();
    s.loading.clear();
    s.open.add(rootPath); // root is always expanded
    s.loading.add(rootPath);
    bump();
    readDir(rootPath)
      .then((entries) => {
        s.cache.set(rootPath, entries);
      })
      .catch((e) => {
        console.error("readDir(root) failed:", e);
        s.cache.set(rootPath, []);
      })
      .finally(() => {
        s.loading.delete(rootPath);
        bump();
      });
  }, [rootPath, bump]);

  // Refresh affected folders after fs mutations (drag & drop moves)
  useEffect(() => {
    const onRefresh = async (e: Event) => {
      const detail = (e as CustomEvent<{ folders: string[] }>).detail;
      if (!detail?.folders?.length) return;
      const s = stateRef.current;
      for (const folder of detail.folders) {
        if (!folder) continue;
        try {
          const entries = await readDir(folder);
          s.cache.set(folder, entries);
        } catch (err) {
          console.error("refresh readDir failed:", err);
        }
      }
      bump();
    };
    window.addEventListener("sidebar:refresh-folders", onRefresh as EventListener);
    return () => window.removeEventListener("sidebar:refresh-folders", onRefresh as EventListener);
  }, [bump]);

  const onFileClick = useCallback(
    (entry: DirEntry) => {
      openFile(entry.path);
    },
    [openFile]
  );

  /** Refresh a folder's listing in-place. */
  const refreshFolder = useCallback(
    async (folder: string) => {
      const s = stateRef.current;
      try {
        const entries = await readDir(folder);
        s.cache.set(folder, entries);
      } catch (e) {
        console.error("refreshFolder failed:", e);
      } finally {
        bump();
      }
    },
    [bump]
  );

  /** Close any open tab whose path is or is inside `removed`. */
  const closeTabsUnder = useCallback(
    (removed: string) => {
      if (!closeTab) return;
      const norm = removed.replace(/\\/g, "/");
      for (const t of tabs) {
        const tp = t.path.replace(/\\/g, "/");
        if (tp === norm || tp.startsWith(norm + "/")) {
          closeTab(t.id);
        }
      }
    },
    [tabs, closeTab]
  );

  /** Open the context menu for a tree row (or root). */
  const openMenu: OpenMenu = useCallback((e, target) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, target });
  }, []);

  /** Build the menu items for the current target. */
  const buildMenuItems = useCallback(
    (target: MenuTarget): ContextMenuItem[] => {
      const isDir = target.isDir;
      const isRoot = target.isRoot === true;
      // Folder containing the target (where new file/folder will be created).
      const containerDir = isDir ? target.path : dirname(target.path);
      const s = stateRef.current;

      const ensureOpen = async (folder: string) => {
        if (!s.open.has(folder)) {
          s.open.add(folder);
        }
        if (!s.cache.has(folder)) {
          try {
            s.cache.set(folder, await readDir(folder));
          } catch (err) {
            console.error("readDir failed:", err);
            s.cache.set(folder, []);
          }
        }
      };

      const promptName = async (
        title: string,
        label: string,
        initial = "",
        okLabel = "Create",
      ): Promise<string | null> => {
        const v = await askName({ title, label, initial, okLabel });
        if (v === null) return null;
        const trimmed = v.trim();
        if (!trimmed) return null;
        if (/[\\/]/.test(trimmed)) {
          // Validation already runs inside the dialog, but keep this as a
          // belt-and-braces guard in case the dialog is bypassed.
          window.alert("Name cannot contain slashes.");
          return null;
        }
        return trimmed;
      };

      const doNewFile = async () => {
        const name = await promptName("New file", "File name:", "", "Create");
        if (!name) return;
        try {
          await ensureOpen(containerDir);
          const newPath = joinPath(containerDir, name);
          await createFile(newPath);
          await refreshFolder(containerDir);
          openFile(newPath);
        } catch (err) {
          window.alert(`Failed to create file:\n${err}`);
        }
      };

      const doNewFolder = async () => {
        const name = await promptName("New folder", "Folder name:", "", "Create");
        if (!name) return;
        try {
          await ensureOpen(containerDir);
          const newPath = joinPath(containerDir, name);
          await createDir(newPath);
          await refreshFolder(containerDir);
        } catch (err) {
          window.alert(`Failed to create folder:\n${err}`);
        }
      };

      const doRename = async () => {
        const oldName = target.path.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
        const name = await promptName("Rename", "New name:", oldName, "Rename");
        if (!name || name === oldName) return;
        try {
          const parent = dirname(target.path);
          const newPath = joinPath(parent, name);
          await movePath(target.path, newPath);
          // Best-effort: close any tab pointing at the old path; user can reopen.
          closeTabsUnder(target.path);
          await refreshFolder(parent);
        } catch (err) {
          window.alert(`Failed to rename:\n${err}`);
        }
      };

      const doDelete = async () => {
        const label = isDir ? "folder" : "file";
        const ok = window.confirm(
          `Are you sure you want to delete this ${label}?\n\n${target.path}\n\nThis cannot be undone.`
        );
        if (!ok) return;
        try {
          await deletePath(target.path);
          closeTabsUnder(target.path);
          await refreshFolder(dirname(target.path));
        } catch (err) {
          window.alert(`Failed to delete:\n${err}`);
        }
      };

      const doCopyPath = async () => {
        try {
          await navigator.clipboard.writeText(target.path);
        } catch {
          // ignore
        }
      };

      const doRefresh = async () => {
        await refreshFolder(isDir ? target.path : dirname(target.path));
      };

      const items: ContextMenuItem[] = [
        {
          id: "new-file",
          label: "New File\u2026",
          icon: <I.FilePlus size={14} />,
          onSelect: doNewFile,
        },
        {
          id: "new-folder",
          label: "New Folder\u2026",
          icon: <I.FolderPlus size={14} />,
          onSelect: doNewFolder,
        },
      ];

      if (!isRoot) {
        items.push({ id: "sep1", separator: true });
        items.push({
          id: "rename",
          label: "Rename\u2026",
          icon: <I.Edit size={14} />,
          shortcut: "F2",
          onSelect: doRename,
        });
        items.push({
          id: "delete",
          label: "Delete",
          icon: <I.Trash size={14} />,
          shortcut: "Del",
          danger: true,
          onSelect: doDelete,
        });
      }

      items.push({ id: "sep2", separator: true });
      items.push({
        id: "copy-path",
        label: "Copy Path",
        icon: <I.Copy size={14} />,
        onSelect: doCopyPath,
      });
      items.push({
        id: "refresh",
        label: "Refresh",
        icon: <I.Refresh size={14} />,
        onSelect: doRefresh,
      });

      return items;
    },
    [openFile, refreshFolder, closeTabsUnder]
  );

  const collapseAll = () => {
    const s = stateRef.current;
    s.open.clear();
    if (rootPath) s.open.add(rootPath);
    bump();
  };

  // Filter visible entries by search query (client-side, only over loaded contents)
  const filterEntries = (entries: DirEntry[]): DirEntry[] => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) => e.is_dir || e.name.toLowerCase().includes(q)
    );
  };

  const selectedPath = activeTab?.path ?? null;
  const dirtyCount = tabs.filter((t) => t.dirty).length;

  // -------- Todo view -----------------------------------------------------
  if (view === "todo") {
    return (
      <aside className="sidebar">
        <div className="panel-header">
          <span>TO-DO LIST</span>
          <div className="panel-header__actions">
            {onClose && (
              <button
                className="panel-header__btn"
                title="Hide Sidebar (Ctrl+B)"
                onClick={onClose}
              >
                <I.Close size={13} />
              </button>
            )}
          </div>
        </div>
        <TodoListView />
        {width !== undefined && onResize && (
          <ResizeHandle edge="right" size={width} onResize={onResize} min={180} max={600} />
        )}
      </aside>
    );
  }
  // -------- Database view ------------------------------------------------
  if (view === "db") {
    return (
      <aside className="sidebar">
        <div className="panel-header">
          <span>DATABASE</span>
          <div className="panel-header__actions">
            {onClose && (
              <button
                className="panel-header__btn"
                title="Hide Sidebar (Ctrl+B)"
                onClick={onClose}
              >
                <I.Close size={13} />
              </button>
            )}
          </div>
        </div>
        <DataBaseView />
        {width !== undefined && onResize && (
          <ResizeHandle edge="right" size={width} onResize={onResize} min={180} max={600} />
        )}
      </aside>
    );
  }
  // -------- Files view (default) -----------------------------------------
  const renderRoot = () => {
    if (!rootPath) return null;
    const entries = stateRef.current.cache.get(rootPath);
    if (!entries) {
      return <div className="tree__loading">Loading {rootName}…</div>;
    }
    const filtered = filterEntries(entries);
    if (filtered.length === 0 && search) {
      return <div className="sidebar__empty">No file matches “{search}”</div>;
    }
    // Render children directly under the root header
    return filtered.map((e) =>
      e.is_dir ? (
        <DirNode
          key={e.path}
          entry={e}
          depth={1}
          state={stateRef.current}
          bump={bump}
          selectedPath={selectedPath}
          onFileClick={onFileClick}
          onContextMenu={openMenu}
        />
      ) : (
        <FileNode
          key={e.path}
          entry={e}
          depth={1}
          selected={selectedPath === e.path}
          onClick={() => onFileClick(e)}
          onContextMenu={openMenu}
        />
      )
    );
  };

  return (
    <aside className="sidebar">
      <div className="panel-header">
        <span>{rootName ? rootName.toUpperCase() : "PROJECT"}</span>
        <div className="panel-header__actions">
          <button
            className="panel-header__btn"
            title="Open Folder…"
            onClick={() => openFolder()}
          >
            <I.FolderOpen size={13} />
          </button>
          <button
            className="panel-header__btn"
            title="Collapse all"
            onClick={collapseAll}
            disabled={!rootPath}
          >
            <I.ChevronDown size={13} />
          </button>
          {rootPath && (
            <button
              className="panel-header__btn"
              title="Close Folder"
              onClick={closeFolder}
            >
              <I.Close size={13} />
            </button>
          )}
          {onClose && (
            <button
              className="panel-header__btn"
              title="Hide Sidebar (Ctrl+B)"
              onClick={onClose}
            >
              <I.Close size={13} />
            </button>
          )}
        </div>
      </div>

      {!rootPath ? (
        <div className="sidebar__no-folder">
          <p>No folder is open</p>
          <button className="sidebar__open-btn" onClick={() => openFolder()}>
            Open Folder
          </button>
          <span className="sidebar__hint">Or use File › Open Folder…</span>
        </div>
      ) : (
        <>
          <div className="sidebar__search">
            <I.Search size={13} />
            <input
              placeholder="Filter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            />
          </div>

          <div
            className="sidebar__tree"
            onContextMenu={(e) => {
              // Right-click on the empty area of the tree -> root menu.
              if (e.target === e.currentTarget && rootPath) {
                openMenu(e, { path: rootPath, isDir: true, isRoot: true });
              }
            }}
          >
            <RootDropRow
              rootPath={rootPath}
              rootName={rootName}
              onContextMenu={openMenu}
            />
            {renderRoot()}
          </div>
        </>
      )}

      <div className="sidebar__footer">
        <I.Branch size={12} />
        <span>{rootPath ? "main" : "—"}</span>
        <span className="sidebar__footer-dot">•</span>
        <span className="sidebar__footer-mut">
          {dirtyCount > 0 ? `${dirtyCount} unsaved` : "clean"}
        </span>
      </div>
      {width !== undefined && onResize && (
        <ResizeHandle edge="right" size={width} onResize={onResize} min={180} max={600} />
      )}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={buildMenuItems(menu.target)}
          onClose={closeMenu}
        />
      )}
      {promptReq && (
        <PromptDialog
          title={promptReq.title}
          label={promptReq.label}
          initial={promptReq.initial}
          okLabel={promptReq.okLabel}
          validate={(v) => (/[\\/]/.test(v) ? "Name cannot contain slashes." : null)}
          onClose={(value) => {
            const req = promptReq;
            setPromptReq(null);
            req.resolve(value);
          }}
        />
      )}
    </aside>
  );
}

function RootDropRow({
  rootPath,
  rootName,
  onContextMenu,
}: {
  rootPath: string;
  rootName: string | null;
  onContextMenu: OpenMenu;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder::${rootPath}`,
    data: { type: "folder", path: rootPath },
  });
  return (
    <div
      ref={setNodeRef}
      className={`tree__row tree__row--folder tree__row--root ${isOver ? "is-drop-target" : ""}`}
      title={rootPath}
      onContextMenu={(e) =>
        onContextMenu(e, { path: rootPath, isDir: true, isRoot: true })
      }
    >
      <span className="tree__chev is-open">
        <I.ChevronRight size={12} />
      </span>
      <I.FolderOpen size={14} />
      <span className="tree__label">{rootName}</span>
    </div>
  );
}
