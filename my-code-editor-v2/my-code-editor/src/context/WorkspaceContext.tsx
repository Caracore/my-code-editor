import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  basename,
  extOf,
  extToLanguage,
  pickFolder,
  readDir,
  readFile,
  writeFile,
} from "../services/fs";

export interface WorkspaceTab {
  id: string;
  /** File name (basename). */
  name: string;
  /** Absolute filesystem path on disk. */
  path: string;
  /** Lower-case extension without the dot. */
  ext: string;
  /** CodeMirror language id. */
  language: string;
  /** Editor content. */
  content: string;
  /** Reference content from disk — used to compute the dirty flag. */
  diskContent: string;
  dirty?: boolean;
  pinned?: boolean;
}

interface WorkspaceContextValue {
  // Tabs
  tabs: WorkspaceTab[];
  activeId: string | null;
  activeTab: WorkspaceTab | null;
  setActive: (id: string) => void;
  closeTab: (id: string) => void;
  openFile: (absolutePath: string) => Promise<void>;
  updateContent: (id: string, content: string) => void;
  saveActive: () => Promise<void>;
  togglePinned: (id: string) => void;

  // Workspace folder
  rootPath: string | null;
  rootName: string | null;
  openFolder: (absolutePath?: string) => Promise<void>;
  closeFolder: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function makeId(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);

  const setActive = useCallback((id: string) => setActiveId(id), []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = prev.filter((t) => t.id !== id);
      setActiveId((curr) => {
        if (curr !== id) return curr;
        if (next.length === 0) return null;
        return next[Math.min(idx, next.length - 1)].id;
      });
      return next;
    });
  }, []);

  const openFile = useCallback(async (absolutePath: string) => {
    // Already open? activate.
    let existingId: string | null = null;
    setTabs((prev) => {
      const found = prev.find((t) => t.path === absolutePath);
      if (found) existingId = found.id;
      return prev;
    });
    if (existingId) {
      setActiveId(existingId);
      return;
    }

    let content = "";
    try {
      content = await readFile(absolutePath);
    } catch (e) {
      console.error("Failed to read file:", e);
      content = `// Failed to open ${absolutePath}\n// ${String(e)}\n`;
    }

    const name = basename(absolutePath);
    const ext = extOf(name);
    const tab: WorkspaceTab = {
      id: makeId(),
      name,
      path: absolutePath,
      ext,
      language: extToLanguage(ext),
      content,
      diskContent: content,
      dirty: false,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, content, dirty: content !== t.diskContent } : t
      )
    );
  }, []);

  const saveActive = useCallback(async () => {
    const tab = tabs.find((t) => t.id === activeId);
    if (!tab) return;
    try {
      await writeFile(tab.path, tab.content);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tab.id ? { ...t, diskContent: t.content, dirty: false } : t
        )
      );
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }, [tabs, activeId]);

  const togglePinned = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  }, []);

  const openFolder = useCallback(async (absolutePath?: string) => {
    let folder = absolutePath;
    if (!folder) {
      const picked = await pickFolder();
      if (!picked) return;
      folder = picked;
    }
    try {
      await readDir(folder);
      setRootPath(folder);
    } catch (e) {
      console.error("Cannot open folder:", e);
    }
  }, []);

  const closeFolder = useCallback(() => {
    setRootPath(null);
    setTabs([]);
    setActiveId(null);
  }, []);

  // Listen to global menu actions for File → Open Folder / Save
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      switch (action) {
        case "file:open-folder":
          openFolder();
          break;
        case "file:save":
          saveActive();
          break;
        case "file:close-editor":
          if (activeId) closeTab(activeId);
          break;
      }
    };
    window.addEventListener("menu-action", handler as EventListener);
    return () => window.removeEventListener("menu-action", handler as EventListener);
  }, [openFolder, saveActive, closeTab, activeId]);

  // Ctrl+S to save the active tab
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !e.shiftKey) {
        e.preventDefault();
        saveActive();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveActive]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? null,
    [tabs, activeId]
  );

  const rootName = useMemo(
    () => (rootPath ? basename(rootPath) : null),
    [rootPath]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      tabs,
      activeId,
      activeTab,
      setActive,
      closeTab,
      openFile,
      updateContent,
      saveActive,
      togglePinned,
      rootPath,
      rootName,
      openFolder,
      closeFolder,
    }),
    [
      tabs, activeId, activeTab, setActive, closeTab, openFile,
      updateContent, saveActive, togglePinned,
      rootPath, rootName, openFolder, closeFolder,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

