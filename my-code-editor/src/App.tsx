import React, { useState } from "react"; //Suspense
import MainLayout from "./layout/MainLayout";
import { registerWorkspace } from "./monaco/monacoWorkspace";

import { invoke } from "@tauri-apps/api/core";
import { FileNode } from "./types/FileNode";
import { useFileTree } from "./hooks/useFileTree";
import { useResize } from "./hooks/useResize";

const LazyCodeEditor = React.lazy(
  () => import("./components/Editor/CodeEditor"),
);

export default function App() {
  // ✅ States globaux
  const [code, setCode] = useState("");
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [terminalWidth, setTerminalWidth] = useState(300);
  const [terminalPosition, setTerminalPosition] = useState<"bottom" | "right">(
    "bottom",
  );

  // ✅ Hooks
  const { loadFolder, toggleFolder } = useFileTree();
  const { startResizeRight, startResizeBottom } = useResize();

  // ✅ Terminal
  async function handleRunCommand() {
    if (!terminalInput.trim()) return;

    const result = await invoke<string>("run_command", {
      command: terminalInput,
    });

    setTerminalOutput(
      (prev) => prev + "> " + terminalInput + "\n" + result + "\n",
    );
    setTerminalInput("");
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

    // Recharge l'arborescence
    const root = tree[0];
    const children = await loadFolder(root.path);
    root.children = children;
    setTree([...tree]);

    // Si le fichier renommé était ouvert → mettre à jour
    if (currentPath === oldPath) {
      setCurrentPath(newPath);
    }
  }

  async function handleCreateFile(name: string) {
    //Create a file
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

    // ✅ Enregistrement dans Monaco
    await registerWorkspace(newTree);
  }

  // async function handleOpenFolder() {
  //   const folder = await invoke<string | null>("open_folder_dialog");
  //   if (!folder) return;

  //   const children = await loadFolder(folder);

  //   setTree([
  //     {
  //       path: folder,
  //       name: folder.split("\\").pop()!,
  //       isDir: true,
  //       expanded: true,
  //       children,
  //     },
  //   ]);
  // }

  async function handleSave() {
    if (!currentPath) return;
    await invoke("save_file", { path: currentPath, content: code });
  }

  return (
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
      startResizeRight={(e) => startResizeRight(e, setTerminalWidth)}
      startResizeBottom={(e) => startResizeBottom(e, setTerminalHeight)}
      terminalOutput={terminalOutput}
      terminalInput={terminalInput}
      setTerminalInput={setTerminalInput}
      onRunCommand={handleRunCommand}
      onOpen={handleOpen}
      onSave={handleSave}
      onToggleTerminal={() => setTerminalVisible((v) => !v)}
      onChangeTerminalPosition={setTerminalPosition}
      code={code}
      setCode={setCode}
      LazyCodeEditor={LazyCodeEditor}
      onOpenFileFromTree={handleOpenFileFromTree}
      toggleFolder={(node) => toggleFolder(node, tree, setTree)}
    />
  );
}
