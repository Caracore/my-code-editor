import { invoke } from "@tauri-apps/api/core";
import { registerWorkspace } from "../monaco/monacoWorkspace";
import { FileNode } from "../types/FileNode";

interface FSProps {
  tree: FileNode[];
  setTree: (t: FileNode[]) => void;
  currentPath: string | null;
  setCurrentPath: (p: string | null) => void;
  loadFolder: (path: string) => Promise<FileNode[]>;
}

export function useFileSystem({
  tree,
  setTree,
  currentPath,
  setCurrentPath,
  loadFolder,
}: FSProps) {
  async function refreshTree() {
    if (tree.length === 0) return;
    const root = tree[0];
    const children = await loadFolder(root.path);
    root.children = children;
    setTree([...tree]);
  }

  async function handleRenameFile(oldPath: string, newName: string) {
    if (!newName.trim()) return;

    const folder = oldPath.split("\\").slice(0, -1).join("\\");
    const newPath = `${folder}\\${newName}`;

    await invoke("rename_file", { oldPath, newPath });
    await refreshTree();

    if (currentPath === oldPath) setCurrentPath(newPath);
  }

  async function handleCreateFile(name: string) {
    if (!name.trim() || tree.length === 0) return;

    const root = tree[0];
    const folder = root.path.replace(/\//g, "\\");
    const newPath = `${folder}\\${name}`;

    await invoke("create_file", { path: newPath });

    const children = await loadFolder(folder);
    root.children = children;
    setTree([...tree]);
    setCurrentPath(newPath);
  }

  async function onCreateFileFromContext(folderPath: string, name: string) {
    const newPath = `${folderPath}\\${name}`;
    await invoke("create_file", { path: newPath });
    await refreshTree();
  }

  async function onCreateFolderFromContext(folderPath: string, name: string) {
    const newPath = `${folderPath}\\${name}`;
    await invoke("create_directory", { path: newPath });
    await refreshTree();
  }

  async function handleOpenFileFromTree(path: string) {
    await invoke("read_file", { path });
    setCurrentPath(path);
  }

  async function handleOpenFolder() {
    console.log("📁 Opening folder dialog...");
    const folder = await invoke<string | null>("open_folder_dialog");
    console.log("📁 Selected folder:", folder);
    
    if (!folder) return;

    console.log("📂 Loading folder contents...");
    const children = await loadFolder(folder);
    console.log("📂 Loaded children:", children);

    const newTree = [
      {
        path: folder,
        name: folder.split("\\").pop()!,
        isDir: true,
        expanded: true,
        children,
      },
    ];

    console.log("🌳 Setting tree:", newTree);
    setTree(newTree);
    
    console.log("🔗 Registering workspace...");
    await registerWorkspace(newTree);
    console.log("✅ Folder opened successfully!");
  }

  return {
    refreshTree,
    handleRenameFile,
    handleCreateFile,
    handleOpenFileFromTree,
    handleOpenFolder,
    onCreateFileFromContext,
    onCreateFolderFromContext,
  };
}
