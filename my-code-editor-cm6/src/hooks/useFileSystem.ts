import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import type { FileNode } from "../types/FileNode";
import type { OpenTab } from "../context/TabsContext";

interface FSProps {
  tree: FileNode[];
  setTree: (t: FileNode[]) => void;
  currentPath: string | null;
  setCurrentPath: (p: string | null) => void;
  loadFolder: (path: string) => Promise<FileNode[]>;
  closeTab?: (path: string) => void;
  openTab?: (path: string, content: string) => void;
  tabs?: OpenTab[];
}

function normalizePath(path: string): string {
  return path.replace(/\//g, "\\");
}

export function useFileSystem({
  tree,
  setTree,
  currentPath,
  setCurrentPath,
  loadFolder,
  closeTab,
  openTab,
  tabs = [],
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

    await invoke("rename_file", { 
      oldPath: normalizePath(oldPath), 
      newPath: normalizePath(newPath) 
    });

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
    const folder = normalizePath(root.path);
    const newPath = `${folder}\\${name}`;

    await invoke("create_file", { path: normalizePath(newPath) });

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
    const rootPath = normalizePath(root.path);
    let targetPath = folderPath === "." ? rootPath : normalizePath(folderPath);

    try {
      const stats = await invoke<{ is_dir: boolean }>("check_is_dir", { path: normalizePath(targetPath) });
      if (!stats.is_dir) {
        const parts = targetPath.split(/[/\\]/);
        parts.pop();
        targetPath = parts.join("\\");
      }
    } catch (err) {
      console.error("❌ Erreur check_is_dir:", err);
    }

    const newPath = `${targetPath}\\${name}`;
    await invoke("create_file", { path: normalizePath(newPath) });
    await refreshTree();
  }

  async function onCreateFolderFromContext(folderPath: string, name: string) {
    if (tree.length === 0) {
      alert("Veuillez d'abord ouvrir un dossier pour créer un dossier");
      return;
    }

    const root = tree[0];
    const rootPath = normalizePath(root.path);
    let targetPath = folderPath === "." ? rootPath : normalizePath(folderPath);

    try {
      const stats = await invoke<{ is_dir: boolean }>("check_is_dir", { path: normalizePath(targetPath) });
      if (!stats.is_dir) {
        const parts = targetPath.split(/[/\\]/);
        parts.pop();
        targetPath = parts.join("\\");
      }
    } catch (err) {
      console.error("❌ Erreur check_is_dir:", err);
    }

    const newPath = `${targetPath}\\${name}`;
    await invoke("create_directory", { path: normalizePath(newPath) });
    await refreshTree();
  }

  async function handleOpenFileFromTree(path: string) {
    const content = await invoke<string>("read_file", { path: normalizePath(path) });
    if (openTab) {
      openTab(path, content);
    }
    setCurrentPath(path);
    
    // 🎮 Mise à jour Discord Presence lors de l'ouverture
    try {
      const fileName = path.split(/[\\/]/).pop() || "Untitled";
      const language = detectLanguageFromPath(path);
      const projectName = tree.length > 0 ? tree[0].name : "My Code Editor";
      
      await invoke("update_discord_presence", {
        payload: {
          file: fileName,
          language: language,
          project: projectName
        }
      });
    } catch (error) {
      console.error("❌ Erreur Discord Presence:", error);
    }
  }

  function detectLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'JavaScript', 'jsx': 'JavaScript', 'ts': 'TypeScript', 'tsx': 'TypeScript',
      'py': 'Python', 'java': 'Java', 'cpp': 'C++', 'c': 'C', 'cs': 'C#',
      'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP',
      'html': 'HTML', 'css': 'CSS', 'json': 'JSON', 'md': 'Markdown'
    };
    return langMap[ext || ''] || 'Text';
  }

  async function handleOpenFolder() {
    const folder = await invoke<string | null>("open_folder_dialog");
    if (!folder) return;

    const children = await loadFolder(folder);

    const newTree = [
      {
        path: folder,
        name: folder.split("\\").pop()!,
        isDir: true,
        expanded: true,
        children,
      },
    ];

    setTree(newTree);
  }

  async function handleTrashFile(path: string): Promise<boolean> {
    console.log("🗑️ TRASH PATH =", path);
    const fileName = path.split(/[/\\]/).pop();

    const ok = await confirm(`Voulez-vous vraiment envoyer « ${fileName} » à la corbeille ?`, {
      title: "Envoyer à la corbeille",
      kind: "warning",
      okLabel: "Envoyer",
      cancelLabel: "Annuler",
    });

    if (!ok) return false;

    try {
      const normalizedPath = normalizePath(path);
      await invoke("trash_file", { path: normalizedPath });
      
      // ✅ Fermer tous les onglets concernés (fichier ou dossier)
      if (closeTab && tabs) {
        tabs.forEach(tab => {
          const normalizedTabPath = normalizePath(tab.path);
          // Si c'est le fichier exact OU un fichier dans le dossier supprimé
          if (normalizedTabPath === normalizedPath || normalizedTabPath.startsWith(normalizedPath + "\\")) {
            closeTab(tab.path);
          }
        });
      }
      
      // ✅ Réinitialiser le currentPath si nécessaire
      if (currentPath && (normalizePath(currentPath) === normalizedPath || normalizePath(currentPath).startsWith(normalizedPath + "\\"))) {
        setCurrentPath(null);
      }
      
      await refreshTree();
      return true;
    } catch (e) {
      console.error("Erreur corbeille:", e);
      alert("Erreur lors de l'envoi à la corbeille");
      return false;
    }
  }

  async function handleDeleteFile(path: string): Promise<boolean> {
    console.log("❌ DELETE PATH =", path);

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
      const normalizedPath = normalizePath(path);
      await invoke("delete_file", { path: normalizedPath });
      
      // ✅ Fermer tous les onglets concernés (fichier ou dossier)
      if (closeTab && tabs) {
        tabs.forEach(tab => {
          const normalizedTabPath = normalizePath(tab.path);
          // Si c'est le fichier exact OU un fichier dans le dossier supprimé
          if (normalizedTabPath === normalizedPath || normalizedTabPath.startsWith(normalizedPath + "\\")) {
            closeTab(tab.path);
          }
        });
      }
      
      // ✅ Réinitialiser le currentPath si nécessaire
      if (currentPath && (normalizePath(currentPath) === normalizedPath || normalizePath(currentPath).startsWith(normalizedPath + "\\"))) {
        setCurrentPath(null);
      }
      
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

// import { invoke } from "@tauri-apps/api/core";
// import { confirm } from "@tauri-apps/plugin-dialog";
// import type { FileNode } from "../types/FileNode";

// interface FSProps {
//   tree: FileNode[];
//   setTree: (t: FileNode[]) => void;
//   currentPath: string | null;
//   setCurrentPath: (p: string | null) => void;
//   loadFolder: (path: string) => Promise<FileNode[]>;
// }

// function normalizePath(path: string): string {
//   return path.replace(/\//g, "\\");
// }

// export function useFileSystem({
//   tree,
//   setTree,
//   currentPath,
//   setCurrentPath,
//   loadFolder,
// }: FSProps) {

//   async function refreshTree() {
//     if (tree.length === 0) return;
//     const root = tree[0];
//     const children = await loadFolder(root.path);
//     root.children = children;
//     setTree([...tree]);
//   }

//   async function handleRenameFile(oldPath: string, newName: string) {
//     if (!newName.trim()) return;

//     const folder = oldPath.split("\\").slice(0, -1).join("\\");
//     const newPath = `${folder}\\${newName}`;

//     await invoke("rename_file", { oldPath, newPath });
//     await refreshTree();

//     if (currentPath === oldPath) setCurrentPath(newPath);
//   }

//   async function handleCreateFile(name: string) {
//     if (!name.trim()) return;

//     if (tree.length === 0) {
//       alert("Veuillez d'abord ouvrir un dossier pour créer un fichier");
//       return;
//     }

//     const root = tree[0];
//     const folder = root.path.replace(/\//g, "\\");
//     const newPath = `${folder}\\${name}`;

//     await invoke("create_file", { path: newPath });

//     const children = await loadFolder(folder);
//     root.children = children;
//     setTree([...tree]);
//     setCurrentPath(newPath);
//   }

//   async function onCreateFileFromContext(folderPath: string, name: string) {
//     if (tree.length === 0) {
//       alert("Veuillez d'abord ouvrir un dossier pour créer un fichier");
//       return;
//     }

//     const root = tree[0];
//     const rootPath = root.path.replace(/\//g, "\\");
//     let targetPath = folderPath === "." ? rootPath : folderPath;

//     try {
//       const stats = await invoke<{ is_dir: boolean }>("check_is_dir", { path: targetPath });
//       if (!stats.is_dir) {
//         const parts = targetPath.split(/[/\\]/);
//         parts.pop();
//         targetPath = parts.join("\\");
//       }
//     } catch (err) {
//       console.error("❌ Erreur check_is_dir:", err);
//     }

//     const newPath = `${targetPath}\\${name}`;
//     await invoke("create_file", { path: newPath });
//     await refreshTree();
//   }

//   async function onCreateFolderFromContext(folderPath: string, name: string) {
//     if (tree.length === 0) {
//       alert("Veuillez d'abord ouvrir un dossier pour créer un dossier");
//       return;
//     }

//     const root = tree[0];
//     const rootPath = root.path.replace(/\//g, "\\");
//     let targetPath = folderPath === "." ? rootPath : folderPath;

//     try {
//       const stats = await invoke<{ is_dir: boolean }>("check_is_dir", { path: targetPath });
//       if (!stats.is_dir) {
//         const parts = targetPath.split(/[/\\]/);
//         parts.pop();
//         targetPath = parts.join("\\");
//       }
//     } catch (err) {
//       console.error("❌ Erreur check_is_dir:", err);
//     }

//     const newPath = `${targetPath}\\${name}`;
//     await invoke("create_directory", { path: newPath });
//     await refreshTree();
//   }

//   async function handleOpenFileFromTree(path: string) {
//     await invoke("read_file", { path });
//     setCurrentPath(path);
//   }

//   async function handleOpenFolder() {
//     const folder = await invoke<string | null>("open_folder_dialog");
//     if (!folder) return;

//     const children = await loadFolder(folder);

//     const newTree = [
//       {
//         path: folder,
//         name: folder.split("\\").pop()!,
//         isDir: true,
//         expanded: true,
//         children,
//       },
//     ];

//     setTree(newTree);
//   }

//   async function handleTrashFile(path: string): Promise<boolean> {
//     console.log("🗑️ TRASH PATH =", path);
//     const fileName = path.split(/[/\\]/).pop();

//     const ok = await confirm(`Voulez-vous vraiment envoyer « ${fileName} » à la corbeille ?`, {
//       title: "Envoyer à la corbeille",
//       kind: "warning",
//       okLabel: "Envoyer",
//       cancelLabel: "Annuler",
//     });

//     if (!ok) return false;

//     try {
//       await invoke("trash_file", { path });
//       await refreshTree();
//       return true;
//     } catch (e) {
//       console.error("Erreur corbeille:", e);
//       alert("Erreur lors de l'envoi à la corbeille");
//       return false;
//     }
//   }

//   async function handleDeleteFile(path: string): Promise<boolean> {
//     console.log("❌ DELETE PATH =", path);

//     const fileName = path.split(/[/\\]/).pop();

//     const ok = await confirm(
//       `⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\nVoulez-vous vraiment supprimer « ${fileName} » ?\nCette action est irréversible.`,
//       {
//         title: "Suppression définitive",
//         kind: "error",
//         okLabel: "Supprimer",
//         cancelLabel: "Annuler",
//       }
//     );

//     if (!ok) return false;

//     try {
//       await invoke("delete_file", { path });
//       await refreshTree();
//       return true;
//     } catch (e) {
//       console.error("Erreur suppression définitive:", e);
//       alert("Erreur lors de la suppression");
//       return false;
//     }
//   }

//   return {
//     refreshTree,
//     handleRenameFile,
//     handleCreateFile,
//     handleOpenFileFromTree,
//     handleOpenFolder,
//     onCreateFileFromContext,
//     onCreateFolderFromContext,
//     handleTrashFile,
//     handleDeleteFile,
//   };
// }

