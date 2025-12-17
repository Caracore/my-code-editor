import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
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
    if (!name.trim()) return;
    
    if (tree.length === 0) {
      alert("Veuillez d'abord ouvrir un dossier pour créer un fichier");
      return;
    }

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
    if (tree.length === 0) {
      alert("Veuillez d'abord ouvrir un dossier pour créer un fichier");
      return;
    }

    const root = tree[0];
    const rootPath = root.path.replace(/\//g, "\\");
    
    // Si folderPath est ".", créer à la racine
    let targetPath = folderPath === "." ? rootPath : folderPath;
    
    console.log("🔍 Creating file, folderPath:", folderPath, "targetPath:", targetPath);
    
    // Si le path sélectionné est un fichier, prendre son dossier parent
    try {
      const stats = await invoke<{ is_dir: boolean }>("check_is_dir", { path: targetPath });
      console.log("📁 check_is_dir result:", stats);
      if (!stats.is_dir) {
        // C'est un fichier, prendre le parent
        const parts = targetPath.split(/[/\\]/);
        parts.pop();
        targetPath = parts.join("\\");
        console.log("📄 Fichier détecté, création dans le parent:", targetPath);
      } else {
        console.log("📁 Dossier détecté, création dedans:", targetPath);
      }
    } catch (err) {
      console.error("❌ Erreur check_is_dir:", err);
    }
    
    const newPath = `${targetPath}\\${name}`;
    console.log("✅ Final path:", newPath);
    await invoke("create_file", { path: newPath });
    await refreshTree();
  }

  async function onCreateFolderFromContext(folderPath: string, name: string) {
    if (tree.length === 0) {
      alert("Veuillez d'abord ouvrir un dossier pour créer un dossier");
      return;
    }

    const root = tree[0];
    const rootPath = root.path.replace(/\//g, "\\");
    
    // Si folderPath est ".", créer à la racine
    let targetPath = folderPath === "." ? rootPath : folderPath;
    
    console.log("🔍 Creating folder, folderPath:", folderPath, "targetPath:", targetPath);
    
    // Si le path sélectionné est un fichier, prendre son dossier parent
    try {
      const stats = await invoke<{ is_dir: boolean }>("check_is_dir", { path: targetPath });
      console.log("📁 check_is_dir result:", stats);
      if (!stats.is_dir) {
        // C'est un fichier, prendre le parent
        const parts = targetPath.split(/[/\\]/);
        parts.pop();
        targetPath = parts.join("\\");
        console.log("📄 Fichier détecté, création dans le parent:", targetPath);
      } else {
        console.log("📁 Dossier détecté, création dedans:", targetPath);
      }
    } catch (err) {
      console.error("❌ Erreur check_is_dir:", err);
    }
    
    const newPath = `${targetPath}\\${name}`;
    console.log("✅ Final path:", newPath);
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

  async function handleTrashFile(path: string): Promise<boolean> {
    const fileName = path.split(/[/\\]/).pop();
    
    const ok = await confirm(`Voulez-vous vraiment envoyer « ${fileName} » à la corbeille ?`, {
      title: "Envoyer à la corbeille",
      kind: "warning",
      okLabel: "Envoyer",
      cancelLabel: "Annuler",
    });
    
    if (!ok) return false;

    try {
      await invoke("trash_file", { path });
      await refreshTree();
      return true;
    } catch (e) {
      console.error("Erreur corbeille:", e);
      alert("Erreur lors de l'envoi à la corbeille");
      return false;
    }
  }

  async function handleDeleteFile(path: string): Promise<boolean> {
    const fileName = path.split(/[/\\]/).pop();
    
    const ok = await confirm(
      `⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\nVoulez-vous vraiment supprimer « ${fileName} » ?\nCette action est irréversible.`,
      {
        title: "Suppression définitive",
        kind: "error",
        okLabel: "Supprimer",
        cancelLabel: "Annuler",
      }
    );
    
    if (!ok) return false;

    try {
      await invoke("delete_file", { path });
      await refreshTree();
      return true;
    } catch (e) {
      console.error("Erreur suppression définitive:", e);
      alert("Erreur lors de la suppression");
      return false;
    }
  }

  return {
    refreshTree,
    handleRenameFile,
    handleCreateFile,
    handleOpenFileFromTree,
    handleOpenFolder,
    onCreateFileFromContext,
    onCreateFolderFromContext,
    handleTrashFile,
    handleDeleteFile,
  };
}
