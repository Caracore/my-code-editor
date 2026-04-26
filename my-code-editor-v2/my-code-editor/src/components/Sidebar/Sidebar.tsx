import { useCallback, useEffect, useRef, useState } from "react";
import { I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import { extOf, readDir } from "../../services/fs";
import type { DirEntry } from "../../services/fs";
import "./Sidebar.css";

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
}

function FolderView({ path, depth, state, bump, selectedPath, onFileClick }: FolderViewProps) {
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
          />
        ) : (
          <FileNode
            key={e.path}
            entry={e}
            depth={depth}
            selected={selectedPath === e.path}
            onClick={() => onFileClick(e)}
          />
        )
      )}
    </>
  );
}

function DirNode({
  entry, depth, state, bump, selectedPath, onFileClick,
}: {
  entry: DirEntry; depth: number; state: TreeState; bump: () => void;
  selectedPath: string | null; onFileClick: (entry: DirEntry) => void;
}) {
  const isOpen = state.open.has(entry.path);

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
        className="tree__row tree__row--folder"
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={toggle}
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
        />
      )}
    </div>
  );
}

function FileNode({
  entry, depth, selected, onClick,
}: {
  entry: DirEntry; depth: number; selected: boolean; onClick: () => void;
}) {
  const ext = extOf(entry.name);
  return (
    <div
      className={`tree__row ${selected ? "is-selected" : ""}`}
      style={{ paddingLeft: 8 + depth * 14 + 14 }}
      onClick={onClick}
      title={entry.path}
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
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const { activeTab, openFile, openFolder, closeFolder, rootPath, rootName, tabs } = useWorkspace();

  // Tree state — refs for in-place mutation, with a `tick` to re-render.
  const stateRef = useRef<TreeState>({
    cache: new Map(),
    open: new Set(),
    loading: new Set(),
  });
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const [search, setSearch] = useState("");

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

  const onFileClick = useCallback(
    (entry: DirEntry) => {
      openFile(entry.path);
    },
    [openFile]
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

  // Patch FolderView to apply search filter on the fly
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
        />
      ) : (
        <FileNode
          key={e.path}
          entry={e}
          depth={1}
          selected={selectedPath === e.path}
          onClick={() => onFileClick(e)}
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

          <div className="sidebar__tree">
            <div
              className="tree__row tree__row--folder tree__row--root"
              title={rootPath}
            >
              <span className="tree__chev is-open">
                <I.ChevronRight size={12} />
              </span>
              <I.FolderOpen size={14} />
              <span className="tree__label">{rootName}</span>
            </div>
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
    </aside>
  );
}
