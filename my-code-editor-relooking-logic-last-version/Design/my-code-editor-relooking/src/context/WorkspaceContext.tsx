import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FileNode } from "../types/FileNode";
import { useFileTree } from "../hooks/useFileTree";
import { useFileSystem } from "../hooks/useFileSystem";
import { useTabs } from "./TabsContext";

export type ActivityView = "files" | "search" | "git" | "debug" | "ext" | "ai";

interface WorkspaceContextType {
  // File tree
  tree: FileNode[];
  setTree: (t: FileNode[]) => void;
  currentPath: string | null;
  rootPath: string | null;
  reloadTreeWithState: () => Promise<void>;

  // File operations (forwarded from useFileSystem)
  handleRenameFile: (oldPath: string, newName: string) => Promise<void>;
  handleCreateFile: (name: string) => Promise<void>;
  handleOpenFileFromTree: (path: string) => Promise<void>;
  handleOpenFolder: () => Promise<void>;
  onCreateFileFromContext: (folder: string, name: string) => Promise<void>;
  onCreateFolderFromContext: (folder: string, name: string) => Promise<void>;
  handleTrashFile: (path: string) => Promise<boolean>;
  handleDeleteFile: (path: string) => Promise<boolean>;
  toggleFolder: (node: FileNode) => Promise<void>;

  // UI state
  activityView: ActivityView;
  setActivityView: (v: ActivityView) => void;
  sidebarVisible: boolean;
  setSidebarVisible: (v: boolean) => void;
  bottomPanelVisible: boolean;
  setBottomPanelVisible: (v: boolean) => void;
  rightPanelVisible: boolean;
  setRightPanelVisible: (v: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  settingsPanelOpen: boolean;
  setSettingsPanelOpen: (v: boolean) => void;
  themeManagerOpen: boolean;
  setThemeManagerOpen: (v: boolean) => void;
  todoListOpen: boolean;
  setTodoListOpen: (v: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const treeRef = useRef<FileNode[]>(tree);
  useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  const { closeTab, openTab, tabs } = useTabs();
  const { loadFolder, toggleFolder } = useFileTree();

  const handleToggleFolder = async (node: FileNode) => {
    await toggleFolder(node, tree, setTree);
  };

  const reloadTreeWithState = async () => {
    const rootPath =
      currentPath ||
      (treeRef.current.length > 0 ? treeRef.current[0].path : null);
    if (!rootPath) return;

    const expandedPaths = new Set<string>();
    const collectExpandedPaths = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (node.expanded) expandedPaths.add(node.path);
        if (node.children) collectExpandedPaths(node.children);
      });
    };
    collectExpandedPaths(treeRef.current);

    const children = await loadFolder(rootPath);
    const newTree = [
      {
        path: rootPath,
        name: rootPath.split(/[/\\]/).pop()!,
        isDir: true,
        expanded: true,
        children,
      },
    ];

    const applyExpandedState = async (
      nodes: FileNode[],
    ): Promise<FileNode[]> => {
      const result: FileNode[] = [];
      for (const node of nodes) {
        if (node.isDir && expandedPaths.has(node.path)) {
          const c = await loadFolder(node.path);
          const expandedChildren = await applyExpandedState(c);
          result.push({ ...node, expanded: true, children: expandedChildren });
        } else {
          result.push(node);
        }
      }
      return result;
    };

    const mergedTree = await applyExpandedState(newTree);
    setTree(mergedTree);
  };

  const fs = useFileSystem({
    tree,
    setTree,
    currentPath,
    setCurrentPath,
    loadFolder,
    closeTab,
    openTab,
    tabs,
  });

  // LSP goto-definition handler
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const custom = e as CustomEvent<{
        path: string;
        line: number;
        character: number;
      }>;
      const detail = custom.detail;
      if (!detail) return;

      const dispatchPosition = () => {
        window.dispatchEvent(
          new CustomEvent("editor:goto-position", { detail }),
        );
      };

      const alreadyOpen = tabsRef.current.some((t) => t.path === detail.path);
      if (alreadyOpen) {
        dispatchPosition();
        setTimeout(dispatchPosition, 50);
        return;
      }
      try {
        await fs.handleOpenFileFromTree(detail.path);
        setTimeout(dispatchPosition, 100);
      } catch (err) {
        console.error("[Workspace] goto-definition failed", err);
      }
    };
    window.addEventListener("lsp:goto-definition", handler as EventListener);
    return () =>
      window.removeEventListener(
        "lsp:goto-definition",
        handler as EventListener,
      );
  }, [fs.handleOpenFileFromTree]);

  // UI state
  const [activityView, setActivityView] = useState<ActivityView>("files");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [themeManagerOpen, setThemeManagerOpen] = useState(false);
  const [todoListOpen, setTodoListOpen] = useState(false);

  const rootPath = tree.length > 0 ? tree[0].path : null;

  return (
    <WorkspaceContext.Provider
      value={{
        tree,
        setTree,
        currentPath,
        rootPath,
        reloadTreeWithState,
        handleRenameFile: fs.handleRenameFile,
        handleCreateFile: fs.handleCreateFile,
        handleOpenFileFromTree: fs.handleOpenFileFromTree,
        handleOpenFolder: fs.handleOpenFolder,
        onCreateFileFromContext: fs.onCreateFileFromContext,
        onCreateFolderFromContext: fs.onCreateFolderFromContext,
        handleTrashFile: fs.handleTrashFile,
        handleDeleteFile: fs.handleDeleteFile,
        toggleFolder: handleToggleFolder,

        activityView,
        setActivityView,
        sidebarVisible,
        setSidebarVisible,
        bottomPanelVisible,
        setBottomPanelVisible,
        rightPanelVisible,
        setRightPanelVisible,
        commandPaletteOpen,
        setCommandPaletteOpen,
        settingsPanelOpen,
        setSettingsPanelOpen,
        themeManagerOpen,
        setThemeManagerOpen,
        todoListOpen,
        setTodoListOpen,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used inside a WorkspaceProvider");
  return ctx;
}
