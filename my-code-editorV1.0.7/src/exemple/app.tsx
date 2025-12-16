import React, { useState } from "react";
import MainLayout from "./layout/MainLayout";
import { registerWorkspace } from "./monaco/monacoWorkspace";
import { invoke } from "@tauri-apps/api/core";
import { FileNode } from "./types/FileNode";
import { useFileTree } from "./hooks/useFileTree";
import { ThemeProvider } from "./context/ThemeContext";
import { confirm } from "@tauri-apps/plugin-dialog";

const LazyCodeEditor = React.lazy(
  () => import("./components/Editor/CodeEditor"),
);

export default function App() {
  // ✅ States globaux
  const [code, setCode] = useState("");
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  // const [theme, setTheme] = useState<ThemeName>("joe-dark");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  // const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalShell, setTerminalShell] = useState<"cmd" | "bash">("cmd");
  const [terminalCwd, setTerminalCwd] = useState<string | null>(null);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [terminalWidth, setTerminalWidth] = useState(300);
  const [terminalPosition, setTerminalPosition] = useState<"bottom" | "right">(
    "bottom",
  );

  const onTrashFile = async (path: string) => {
    const fileName = path.split("\\").pop();

    const ok = await confirm(
      `Voulez-vous vraiment envoyer « ${fileName} » à la corbeille ?`,
      {
        title: "Envoyer à la corbeille",
        kind: "warning",
        okLabel: "Envoyer",
        cancelLabel: "Annuler",
      },
    );

    if (!ok) return;

    try {
      await invoke("trash_file", { path });

      if (currentPath === path) {
        setCurrentPath(null);
        setCode("");
      }

      await refreshTree();
    } catch (e) {
      console.error("Erreur corbeille:", e);
    }
  };

  // const onTrashFile = async (path: string) => {
  //   try {
  //     await invoke("trash_file", { path });

  //     // ✅ Si le fichier supprimé était ouvert → fermer l’éditeur
  //     if (currentPath === path) {
  //       setCurrentPath(null);
  //       setCode("");
  //     }

  //     // ✅ Rafraîchir l’arborescence
  //     if (tree.length > 0) {
  //       const root = tree[0];
  //       const children = await loadFolder(root.path);
  //       root.children = children;
  //       setTree([...tree]);
  //     }
  //   } catch (e) {
  //     console.error("Erreur corbeille:", e);
  //   }
  // };

  // const onDeleteFile = async (path: string) => {
  //   try {
  //     await invoke("delete_file", { path });

  //     // ✅ Si le fichier supprimé était ouvert → fermer l’éditeur
  //     if (currentPath === path) {
  //       setCurrentPath(null);
  //       setCode("");
  //     }

  //     // ✅ Rafraîchir l’arborescence
  //     if (tree.length > 0) {
  //       const root = tree[0];
  //       const children = await loadFolder(root.path);
  //       root.children = children;
  //       setTree([...tree]);
  //     }
  //   } catch (e) {
  //     console.error("Erreur suppression définitive:", e);
  //   }
  // };

  const onDeleteFile = async (path: string) => {
    const fileName = path.split("\\").pop();

    const ok = await confirm(
      `⚠️ SUPPRESSION DÉFINITIVE ⚠️

  Voulez-vous vraiment supprimer « ${fileName} » ?
  Cette action est irréversible.`,
      {
        title: "Suppression définitive",
        kind: "error",
        okLabel: "Supprimer",
        cancelLabel: "Annuler",
      },
    );

    if (!ok) return;

    try {
      await invoke("delete_file", { path });
      // ... ton code de refresh
      if (currentPath === path) {
        setCurrentPath(null);
        setCode("");
      }

      await refreshTree();
    } catch (e) {
      console.error("Erreur suppression définitive:", e);
    }
  };
  async function refreshTree() {
    if (tree.length === 0) return;

    const root = tree[0];
    const children = await loadFolder(root.path);
    root.children = children;
    setTree([...tree]);
  }

  // function utilitaire terminal // Prompt Custom:
  function getPrompt() {
    return `${terminalShell} ${terminalCwd ?? ""}> `;
  }
  function handleHistoryUp() {
    if (terminalHistory.length === 0) return;
    const last = terminalHistory[terminalHistory.length - 1];
    setTerminalInput(last);
  }

  function handleHistoryDown() {
    setTerminalInput("");
  }

  // ✅ Resize vertical (terminal en bas)
  const startResizeBottom = (e: React.MouseEvent) => {
    e.preventDefault();

    const startY = e.clientY;
    const startHeight = terminalHeight;

    const MIN = 120;
    const MAX = window.innerHeight * 0.6;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      let newHeight = startHeight - delta;

      newHeight = Math.max(MIN, Math.min(MAX, newHeight));
      setTerminalHeight(newHeight);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ✅ Resize horizontal (terminal à droite)
  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = terminalWidth;

    const MIN = 200;
    const MAX = window.innerWidth * 0.6;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      let newWidth = startWidth + delta;

      newWidth = Math.max(MIN, Math.min(MAX, newWidth));
      setTerminalWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ✅ Hooks
  const { loadFolder, toggleFolder } = useFileTree();

  // ✅ Terminal
  async function handleRunCommand() {
    if (!terminalInput.trim()) return;

    const prompt = getPrompt();
    setTerminalHistory((prev) => [...prev, terminalInput]);
    // setHistoryIndex(-1);
    if (terminalInput.trim() === "clear" || terminalInput.trim() === "cls") {
      setTerminalOutput("");
      setTerminalInput("");
      return;
    }

    // ✅ Ajoute la ligne dans l'historique
    setTerminalOutput((prev) => prev + prompt + terminalInput + "\n");

    const result = await invoke<string>("run_command", {
      command: terminalInput,
      cwd: terminalCwd,
      shell: terminalShell, // ✅ ici
    });

    // ✅ Ajoute la sortie brute
    setTerminalOutput((prev) => prev + result + "\n");

    // ❌ NE PAS remettre le prompt ici
    // ✅ Le prompt est affiché dans le rendu, pas dans l'historique

    setTerminalInput("");
    // ✅ Redonne le focus automatiquement
    setTimeout(() => {
      const el = document.querySelector(".terminal-input") as HTMLInputElement;
      el?.focus();
    }, 0);
  }

  // ✅ Fichiers
  async function handleRenameFile(oldPath: string, newName: string) {
    if (!newName.trim()) return;

    const folder = oldPath.split("\\").slice(0, -1).join("\\");
    const newPath = `${folder}\\${newName}`;

    try {
      await invoke("rename_file", { oldPath, newPath });
    } catch (e) {
      console.error("Erreur renommage:", e);
      return;
    }

    await refreshTree();

    if (currentPath === oldPath) {
      setCurrentPath(newPath);
    }
  }

  async function handleCreateFile(name: string) {
    if (!name.trim()) return;

    if (tree.length === 0) {
      alert("Ouvre d'abord un dossier.");
      return;
    }

    const root = tree[0];
    if (!root.isDir) {
      console.error("La racine n'est pas un dossier.");
      return;
    }

    const folder = root.path.replace(/\//g, "\\");
    const newPath = `${folder}\\${name}`;

    try {
      await invoke("create_file", { path: newPath });
    } catch (e) {
      console.error("Erreur création fichier:", e);
      return;
    }

    const children = await loadFolder(folder);
    root.children = children;
    setTree([...tree]);

    setCurrentPath(newPath);
    setCode("");
  }

  async function handleOpen() {
    const path = await invoke<string | null>("open_file_dialog");
    if (!path) return;

    const content = await invoke<string>("read_file", { path });
    setCurrentPath(path);
    setCode(content);
  }

  async function handleOpenFileFromTree(path: string) {
    const content = await invoke<string>("read_file", { path });
    setCurrentPath(path);
    setCode(content);
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
    setTerminalCwd(folder);
    setTerminalOutput(`my-code-editor ${folder}> `);
    // setTerminalOutput(`Terminal initialisé dans : ${folder}\n`);
    await registerWorkspace(newTree);
  }

  async function handleSave() {
    if (!currentPath) return;
    await invoke("save_file", { path: currentPath, content: code });
  }

  return (
    <ThemeProvider>
      <MainLayout
        tree={tree}
        onRenameFile={handleRenameFile}
        onCreateFile={handleCreateFile}
        onOpenFolder={handleOpenFolder}
        currentPath={currentPath}
        terminalVisible={terminalVisible}
        terminalPosition={terminalPosition}
        terminalWidth={terminalWidth}
        terminalHeight={terminalHeight}
        startResizeRight={startResizeRight}
        startResizeBottom={startResizeBottom}
        terminalOutput={terminalOutput}
        terminalInput={terminalInput}
        setTerminalInput={setTerminalInput}
        onRunCommand={handleRunCommand}
        terminalShell={terminalShell}
        setTerminalShell={setTerminalShell}
        terminalPrompt={getPrompt()}
        onHistoryUp={handleHistoryUp}
        onHistoryDown={handleHistoryDown}
        onOpen={handleOpen}
        onSave={handleSave}
        onToggleTerminal={() => setTerminalVisible((v) => !v)}
        onChangeTerminalPosition={setTerminalPosition}
        code={code}
        setCode={setCode}
        LazyCodeEditor={LazyCodeEditor}
        onOpenFileFromTree={handleOpenFileFromTree}
        toggleFolder={(node) => toggleFolder(node, tree, setTree)}
        onTrashFile={onTrashFile}
        onDeleteFile={onDeleteFile}
      />
    </ThemeProvider>
  );
}