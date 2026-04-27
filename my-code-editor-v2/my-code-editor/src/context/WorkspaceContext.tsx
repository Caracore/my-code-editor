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
import { lspManager } from "../lsp";

/* ============================================================
   Types
   ============================================================ */

export interface WorkspaceTab {
  id: string;
  name: string;
  path: string;
  ext: string;
  language: string;
  content: string;
  diskContent: string;
  dirty?: boolean;
  pinned?: boolean;
}

export interface EditorPane {
  id: string;
  tabIds: string[];
  activeTabId: string | null;
}

/** Up to 4 panes, arranged as 1×1, 1×2 (v-split), 2×1 (h-split) or 2×2 (quad). */
export type LayoutSlot = "tl" | "tr" | "bl" | "br";

export interface Layout {
  cols: 1 | 2;
  rows: 1 | 2;
  /** paneId by slot. Only slots used by the current cols×rows are populated. */
  panes: Partial<Record<LayoutSlot, string>>;
}

interface WorkspaceContextValue {
  tabs: WorkspaceTab[];

  // Split layout
  panes: EditorPane[];
  layout: Layout;
  activePaneId: string;
  setActivePane: (paneId: string) => void;
  splitRight: (sourcePaneId?: string) => void;
  splitDown: (sourcePaneId?: string) => void;
  closePane: (paneId: string) => void;
  moveTab: (tabId: string, toPaneId: string, toIndex?: number) => void;

  // Back-compat (active pane's active tab)
  activeId: string | null;
  activeTab: WorkspaceTab | null;
  setActive: (tabId: string, paneId?: string) => void;
  closeTab: (tabId: string, paneId?: string) => void;

  openFile: (absolutePath: string, paneId?: string) => Promise<void>;
  updateContent: (id: string, content: string) => void;
  saveActive: () => Promise<void>;
  togglePinned: (id: string) => void;
  updateTabPath: (oldPath: string, newPath: string) => void;

  // Workspace folder
  rootPath: string | null;
  rootName: string | null;
  openFolder: (absolutePath?: string) => Promise<void>;
  closeFolder: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function makeId(prefix = "t"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const ROOT_PANE_ID = "p-root";

function slotsForLayout(cols: 1 | 2, rows: 1 | 2): LayoutSlot[] {
  const slots: LayoutSlot[] = ["tl"];
  if (cols === 2) slots.push("tr");
  if (rows === 2) slots.push("bl");
  if (cols === 2 && rows === 2) slots.push("br");
  return slots;
}

/* ============================================================
   Provider
   ============================================================ */

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [rootPath, setRootPath] = useState<string | null>(null);

  const [panes, setPanes] = useState<EditorPane[]>([
    { id: ROOT_PANE_ID, tabIds: [], activeTabId: null },
  ]);
  const [layout, setLayout] = useState<Layout>({
    cols: 1, rows: 1, panes: { tl: ROOT_PANE_ID },
  });
  const [activePaneId, setActivePaneId] = useState<string>(ROOT_PANE_ID);

  const findSlot = useCallback(
    (paneId: string): LayoutSlot | null => {
      for (const s of Object.keys(layout.panes) as LayoutSlot[]) {
        if (layout.panes[s] === paneId) return s;
      }
      return null;
    },
    [layout]
  );

  /* ---------- Pane / tab ops ---------- */

  const setActivePane = useCallback((paneId: string) => {
    setActivePaneId(paneId);
  }, []);

  const setActive = useCallback((tabId: string, paneId?: string) => {
    setPanes((prev) => {
      const owner = prev.find((p) => p.tabIds.includes(tabId));
      const targetId = paneId ?? owner?.id;
      if (!targetId) return prev;
      setActivePaneId(targetId);
      return prev.map((p) =>
        p.id === targetId && p.tabIds.includes(tabId)
          ? { ...p, activeTabId: tabId }
          : p
      );
    });
  }, []);

  const closeTab = useCallback((tabId: string, paneId?: string) => {
    setPanes((prev) => {
      const target = paneId
        ? prev.find((p) => p.id === paneId)
        : prev.find((p) => p.tabIds.includes(tabId));
      if (!target) return prev;
      const idx = target.tabIds.indexOf(tabId);
      if (idx === -1) return prev;
      const nextIds = target.tabIds.filter((id) => id !== tabId);
      let nextActive = target.activeTabId;
      if (nextActive === tabId) {
        nextActive = nextIds.length
          ? nextIds[Math.min(idx, nextIds.length - 1)]
          : null;
      }
      const result = prev.map((p) =>
        p.id === target.id
          ? { ...p, tabIds: nextIds, activeTabId: nextActive }
          : p
      );
      // Drop tab from registry if no pane references it any longer.
      const stillReferenced = result.some((p) => p.tabIds.includes(tabId));
      if (!stillReferenced) {
        setTabs((tt) => tt.filter((t) => t.id !== tabId));
      }
      return result;
    });
  }, []);

  const openFile = useCallback(
    async (absolutePath: string, paneId?: string) => {
      const targetPaneId = paneId ?? activePaneId;
      // Already open in some pane? Activate it.
      const existing = tabs.find((t) => t.path === absolutePath);
      if (existing) {
        const owner = panes.find((p) => p.tabIds.includes(existing.id));
        if (owner) {
          // If a specific pane was requested and the file is open elsewhere,
          // move it to the requested pane instead of just focusing the owner.
          if (paneId && owner.id !== paneId) {
            setPanes((prev) => {
              const next = prev.map((p) => ({ ...p, tabIds: [...p.tabIds] }));
              const from = next.find((p) => p.id === owner.id)!;
              const to = next.find((p) => p.id === paneId);
              if (!to) return prev;
              const idx = from.tabIds.indexOf(existing.id);
              from.tabIds.splice(idx, 1);
              if (from.activeTabId === existing.id) {
                from.activeTabId =
                  from.tabIds[Math.min(idx, from.tabIds.length - 1)] ?? null;
              }
              if (!to.tabIds.includes(existing.id)) to.tabIds.push(existing.id);
              to.activeTabId = existing.id;
              return next;
            });
            setActivePaneId(paneId);
            return;
          }
          setActivePaneId(owner.id);
          setPanes((prev) =>
            prev.map((p) =>
              p.id === owner.id ? { ...p, activeTabId: existing.id } : p
            )
          );
          return;
        }
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
      const tab: WorkspaceTab =
        existing ?? {
          id: makeId("t"),
          name,
          path: absolutePath,
          ext,
          language: extToLanguage(ext),
          content,
          diskContent: content,
          dirty: false,
        };
      if (!existing) setTabs((prev) => [...prev, tab]);
      setPanes((prev) =>
        prev.map((p) =>
          p.id === targetPaneId
            ? {
                ...p,
                tabIds: p.tabIds.includes(tab.id) ? p.tabIds : [...p.tabIds, tab.id],
                activeTabId: tab.id,
              }
            : p
        )
      );
      setActivePaneId(targetPaneId);
    },
    [tabs, panes, activePaneId]
  );

  const updateContent = useCallback((id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, content, dirty: content !== t.diskContent } : t
      )
    );
  }, []);

  const activePane = panes.find((p) => p.id === activePaneId) ?? panes[0];
  const activeId = activePane?.activeTabId ?? null;
  const activeTab = useMemo(
    () => (activeId ? tabs.find((t) => t.id === activeId) ?? null : null),
    [tabs, activeId]
  );

  const saveActive = useCallback(async () => {
    if (!activeTab) return;
    try {
      await writeFile(activeTab.path, activeTab.content);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id
            ? { ...t, diskContent: t.content, dirty: false }
            : t
        )
      );
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }, [activeTab]);

  const togglePinned = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }, []);

  const updateTabPath = useCallback((oldPath: string, newPath: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        const isExact = t.path === oldPath;
        const isInside =
          t.path.startsWith(oldPath + "/") || t.path.startsWith(oldPath + "\\");
        if (!isExact && !isInside) return t;
        const remapped = isExact ? newPath : newPath + t.path.slice(oldPath.length);
        const name = basename(remapped);
        const ext = extOf(name);
        return { ...t, path: remapped, name, ext, language: extToLanguage(ext) };
      })
    );
  }, []);

  const moveTab = useCallback(
    (tabId: string, toPaneId: string, toIndex?: number) => {
      setPanes((prev) => {
        const fromPane = prev.find((p) => p.tabIds.includes(tabId));
        if (!fromPane) return prev;
        const next = prev.map((p) => ({ ...p, tabIds: [...p.tabIds] }));
        const from = next.find((p) => p.id === fromPane.id)!;
        const to = next.find((p) => p.id === toPaneId);
        if (!to) return prev;
        const oldIdx = from.tabIds.indexOf(tabId);
        from.tabIds.splice(oldIdx, 1);
        let insertAt = toIndex ?? to.tabIds.length;
        if (from === to && toIndex !== undefined && toIndex > oldIdx) insertAt = toIndex - 1;
        if (insertAt < 0) insertAt = 0;
        if (insertAt > to.tabIds.length) insertAt = to.tabIds.length;
        to.tabIds.splice(insertAt, 0, tabId);
        if (from.activeTabId === tabId && from !== to) {
          from.activeTabId =
            from.tabIds[Math.min(oldIdx, from.tabIds.length - 1)] ?? null;
        }
        to.activeTabId = tabId;
        return next;
      });
      setActivePaneId(toPaneId);
    },
    []
  );

  /* ---------- Splits ---------- */

  const moveActiveTabToPane = (sourcePaneId: string, destPaneId: string) => {
    setPanes((prev) => {
      const fromPane = prev.find((p) => p.id === sourcePaneId);
      if (!fromPane || !fromPane.activeTabId) return prev;
      const tabId = fromPane.activeTabId;
      const next = prev.map((p) => ({ ...p, tabIds: [...p.tabIds] }));
      const from = next.find((p) => p.id === sourcePaneId)!;
      const to = next.find((p) => p.id === destPaneId)!;
      const idx = from.tabIds.indexOf(tabId);
      from.tabIds.splice(idx, 1);
      from.activeTabId =
        from.tabIds[Math.min(idx, from.tabIds.length - 1)] ?? null;
      to.tabIds.push(tabId);
      to.activeTabId = tabId;
      return next;
    });
  };

  const splitRight = useCallback(
    (sourcePaneId?: string) => {
      if (layout.cols === 2) return;
      const src = sourcePaneId ?? activePaneId;
      const trId = makeId("p");
      const newPanes: EditorPane[] = [
        { id: trId, tabIds: [], activeTabId: null },
      ];
      const nextSlots: Layout["panes"] = { ...layout.panes, tr: trId };
      if (layout.rows === 2) {
        const brId = makeId("p");
        newPanes.push({ id: brId, tabIds: [], activeTabId: null });
        nextSlots.br = brId;
      }
      setPanes((prev) => [...prev, ...newPanes]);
      setLayout({ cols: 2, rows: layout.rows, panes: nextSlots });
      // Defer to after the new pane exists
      queueMicrotask(() => {
        moveActiveTabToPane(src, trId);
        setActivePaneId(trId);
      });
    },
    [layout, activePaneId]
  );

  const splitDown = useCallback(
    (sourcePaneId?: string) => {
      if (layout.rows === 2) return;
      const src = sourcePaneId ?? activePaneId;
      const blId = makeId("p");
      const newPanes: EditorPane[] = [
        { id: blId, tabIds: [], activeTabId: null },
      ];
      const nextSlots: Layout["panes"] = { ...layout.panes, bl: blId };
      if (layout.cols === 2) {
        const brId = makeId("p");
        newPanes.push({ id: brId, tabIds: [], activeTabId: null });
        nextSlots.br = brId;
      }
      setPanes((prev) => [...prev, ...newPanes]);
      setLayout({ cols: layout.cols, rows: 2, panes: nextSlots });
      queueMicrotask(() => {
        moveActiveTabToPane(src, blId);
        setActivePaneId(blId);
      });
    },
    [layout, activePaneId]
  );

  const closePane = useCallback(
    (paneId: string) => {
      const slot = findSlot(paneId);
      if (!slot) return;
      const usedSlots = slotsForLayout(layout.cols, layout.rows);
      if (usedSlots.length <= 1) return;

      if (layout.cols === 2) {
        // Collapse the column containing `paneId`.
        const closingLeft = slot === "tl" || slot === "bl";
        const dropSlots: LayoutSlot[] = closingLeft ? ["tl", "bl"] : ["tr", "br"];
        const dropIds = dropSlots
          .map((s) => layout.panes[s])
          .filter(Boolean) as string[];

        setPanes((prev) => {
          const next = prev.map((p) => ({ ...p, tabIds: [...p.tabIds] }));
          for (const ds of dropSlots) {
            const dropId = layout.panes[ds];
            if (!dropId) continue;
            const isTopRow = ds === "tl" || ds === "tr";
            const partnerSlot: LayoutSlot = closingLeft
              ? isTopRow
                ? "tr"
                : "br"
              : isTopRow
              ? "tl"
              : "bl";
            const partnerId = layout.panes[partnerSlot];
            if (!partnerId) continue;
            const fromP = next.find((p) => p.id === dropId)!;
            const toP = next.find((p) => p.id === partnerId)!;
            for (const tid of fromP.tabIds) {
              if (!toP.tabIds.includes(tid)) toP.tabIds.push(tid);
            }
            if (!toP.activeTabId && toP.tabIds.length) toP.activeTabId = toP.tabIds[0];
          }
          return next.filter((p) => !dropIds.includes(p.id));
        });

        const newSlots: Layout["panes"] = {};
        newSlots.tl = layout.panes[closingLeft ? "tr" : "tl"];
        if (layout.rows === 2) {
          newSlots.bl = layout.panes[closingLeft ? "br" : "bl"];
        }
        const newLayout: Layout = { cols: 1, rows: layout.rows, panes: newSlots };
        setLayout(newLayout);
        if (dropIds.includes(activePaneId)) {
          const fallback = newSlots.tl ?? newSlots.bl;
          if (fallback) setActivePaneId(fallback);
        }
      } else {
        // cols=1, rows=2
        const closingTop = slot === "tl";
        const dropId = layout.panes[closingTop ? "tl" : "bl"]!;
        const keepId = layout.panes[closingTop ? "bl" : "tl"]!;
        setPanes((prev) => {
          const next = prev.map((p) => ({ ...p, tabIds: [...p.tabIds] }));
          const fromP = next.find((p) => p.id === dropId)!;
          const toP = next.find((p) => p.id === keepId)!;
          for (const tid of fromP.tabIds) {
            if (!toP.tabIds.includes(tid)) toP.tabIds.push(tid);
          }
          if (!toP.activeTabId && toP.tabIds.length) toP.activeTabId = toP.tabIds[0];
          return next.filter((p) => p.id !== dropId);
        });
        setLayout({ cols: 1, rows: 1, panes: { tl: keepId } });
        if (activePaneId === dropId) setActivePaneId(keepId);
      }
    },
    [layout, activePaneId, findSlot]
  );

  /* ---------- Workspace folder ---------- */

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
      lspManager.setRootPath(folder);
    } catch (e) {
      console.error("Cannot open folder:", e);
    }
  }, []);

  const closeFolder = useCallback(() => {
    setRootPath(null);
    setTabs([]);
    setPanes([{ id: ROOT_PANE_ID, tabIds: [], activeTabId: null }]);
    setLayout({ cols: 1, rows: 1, panes: { tl: ROOT_PANE_ID } });
    setActivePaneId(ROOT_PANE_ID);
    void lspManager.stopAllServers();
  }, []);

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

  const rootName = useMemo(
    () => (rootPath ? basename(rootPath) : null),
    [rootPath]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      tabs,
      panes, layout, activePaneId,
      setActivePane, splitRight, splitDown, closePane, moveTab,
      activeId, activeTab, setActive, closeTab,
      openFile, updateContent, saveActive, togglePinned, updateTabPath,
      rootPath, rootName, openFolder, closeFolder,
    }),
    [
      tabs, panes, layout, activePaneId,
      setActivePane, splitRight, splitDown, closePane, moveTab,
      activeId, activeTab, setActive, closeTab,
      openFile, updateContent, saveActive, togglePinned, updateTabPath,
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
