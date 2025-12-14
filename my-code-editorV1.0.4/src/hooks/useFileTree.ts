import { invoke } from "@tauri-apps/api/core";
import { FileNode } from "../types/FileNode";

export function useFileTree() {
  async function loadFolder(path: string): Promise<FileNode[]> {
    const entries = await invoke<{ path: string; is_dir: boolean }[]>(
      "list_directory",
      { path },
    );

    return entries.map((e) => ({
      path: e.path,
      name: e.path.split("\\").pop()!,
      isDir: e.is_dir,
      children: e.is_dir ? [] : undefined,
      expanded: false,
    }));
  }

  async function toggleFolder(
    node: FileNode,
    tree: FileNode[],
    setTree: (t: FileNode[]) => void,
  ) {
    if (!node.isDir) return;

    if (node.expanded) {
      node.expanded = false;
      setTree([...tree]);
      return;
    }

    const children = await loadFolder(node.path);
    node.children = children;
    node.expanded = true;
    setTree([...tree]);
  }

  return { loadFolder, toggleFolder };
}
