import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface WorkspaceTab {
  id: string;
  /** File name shown in tab + breadcrumb leaf. */
  name: string;
  /** Full path from project root, e.g. "src/components/EditorArea.tsx". */
  path: string;
  /** File extension (used for icon color & language). */
  ext: string;
  /** Editor language hint passed to CodeMirror (`tsx`, `css`, `python`, …). */
  language: string;
  /** Current document content. */
  content: string;
  dirty?: boolean;
  pinned?: boolean;
}

interface WorkspaceContextValue {
  tabs: WorkspaceTab[];
  activeId: string | null;
  activeTab: WorkspaceTab | null;
  setActive: (id: string) => void;
  closeTab: (id: string) => void;
  openTab: (tab: Omit<WorkspaceTab, "id"> & { id?: string }) => void;
  updateContent: (id: string, content: string) => void;
  saveTab: (id: string) => void;
  togglePinned: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const SAMPLE_TSX = `// EditorArea — heart of the IDE
import { useMemo, useState } from "react";
import type { Document } from "./types";

export default function EditorArea() {
  const [doc, setDoc] = useState<Document>(initial);
  const stats = useMemo(() => ({
    lines: doc.lines.length,
    words: doc.text.split(/\\s+/).length,
    chars: doc.text.length,
  }), [doc]);

  return (
    <section className="editor">
      <Toolbar doc={doc} />
      <Canvas value={doc.text} onChange={setDoc} />
      <MiniMap lines={stats.lines} />
    </section>
  );
}
`;

const SAMPLE_APP = `import TitleBar from "./components/TitleBar/TitleBar";
import EditorArea from "./components/CodeMirror6/EditorArea";

export default function App() {
  return (
    <div className="app">
      <TitleBar />
      <EditorArea />
    </div>
  );
}
`;

const SAMPLE_SIDEBAR = `// Sidebar.tsx — file explorer
export default function Sidebar() {
  return <aside className="sidebar">…</aside>;
}
`;

const SAMPLE_THEME_CSS = `:root {
  --bg-1: #14171d;
  --accent: #7c5cff;
  --accent-2: #5ad1ff;
}
`;

const SAMPLE_PKG = `{
  "name": "my-code-editor",
  "version": "0.2.0",
  "private": true
}
`;

const INITIAL_TABS: WorkspaceTab[] = [
  { id: "1", name: "App.tsx",         path: "src/App.tsx",                              ext: "tsx",  language: "tsx",  content: SAMPLE_APP,     pinned: true },
  { id: "2", name: "Sidebar.tsx",     path: "src/components/Sidebar/Sidebar.tsx",       ext: "tsx",  language: "tsx",  content: SAMPLE_SIDEBAR },
  { id: "3", name: "EditorArea.tsx",  path: "src/components/CodeMirror6/EditorArea.tsx", ext: "tsx", language: "tsx",  content: SAMPLE_TSX,     dirty: true },
  { id: "4", name: "theme.css",       path: "src/styles/theme.css",                     ext: "css",  language: "css",  content: SAMPLE_THEME_CSS },
  { id: "5", name: "package.json",    path: "package.json",                             ext: "json", language: "json", content: SAMPLE_PKG },
];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>(INITIAL_TABS);
  const [activeId, setActiveId] = useState<string | null>("3");

  const setActive = useCallback((id: string) => setActiveId(id), []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = prev.filter((t) => t.id !== id);
      // If we closed the active tab, select the neighbour
      setActiveId((curr) => {
        if (curr !== id) return curr;
        if (next.length === 0) return null;
        const fallback = next[Math.min(idx, next.length - 1)];
        return fallback.id;
      });
      return next;
    });
  }, []);

  const openTab = useCallback((tab: Omit<WorkspaceTab, "id"> & { id?: string }) => {
    setTabs((prev) => {
      // If a tab with this path already exists, just activate it
      const existing = prev.find((t) => t.path === tab.path);
      if (existing) {
        setActiveId(existing.id);
        return prev;
      }
      const id = tab.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next: WorkspaceTab = { ...tab, id };
      setActiveId(id);
      return [...prev, next];
    });
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, content, dirty: t.content !== content ? true : t.dirty } : t
      )
    );
  }, []);

  const saveTab = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, dirty: false } : t)));
  }, []);

  const togglePinned = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? null,
    [tabs, activeId]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      tabs,
      activeId,
      activeTab,
      setActive,
      closeTab,
      openTab,
      updateContent,
      saveTab,
      togglePinned,
    }),
    [tabs, activeId, activeTab, setActive, closeTab, openTab, updateContent, saveTab, togglePinned]
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

