// import { CodeEditor } from "./components/CodeEditor";
import React, { useState, Suspense } from "react";
const LazyCodeEditor = React.lazy(() => import("./components/CodeEditor"));

import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type FileNode = {
  path: string; // Chemin complet
  name: string; // Nom du fichier/dossier
  isDir: boolean; // true = dossier, false = fichier
  children?: FileNode[]; // Sous-fichiers si dossier
  expanded?: boolean; // true = dossier ouvert
};

function Terminal({ output, input, setInput, onRun }: any) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          background: "#000",
          color: "#0f0",
          padding: "8px",
          fontFamily: "monospace",
          overflowY: "auto",
          borderTop: "1px solid #333",
        }}
      >
        <pre style={{ margin: 0 }}>{output}</pre>
      </div>

      <div style={{ display: "flex", background: "#111", padding: "4px" }}>
        <input
          style={{
            flex: 1,
            background: "#222",
            color: "#0f0",
            border: "none",
            padding: "6px",
            fontFamily: "monospace",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onRun()}
        />
        <button onClick={onRun}>Entrer</button>
      </div>
    </div>
  );
}

export default function App() {
  const [code, setCode] = useState("");
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  // const [files, setFiles] = useState<{ path: string; is_dir: boolean }[]>([]);

  const [terminalVisible, setTerminalVisible] = useState(true);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHeight, setTerminalHeight] = useState(200); // pour mode bottom
  const [terminalWidth, setTerminalWidth] = useState(300); // pour mode right
  const [terminalPosition, setTerminalPosition] = useState<"bottom" | "right">(
    "bottom",
  );

  function startResizeBottom(e: React.MouseEvent) {
    const startY = e.clientY;
    const startHeight = terminalHeight;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientY - startY;
      setTerminalHeight(Math.max(100, startHeight - delta));
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function startResizeRight(e: React.MouseEvent) {
    const startX = e.clientX;
    const startWidth = terminalWidth;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      setTerminalWidth(Math.max(150, startWidth - delta));
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

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

  function TreeNode({ node }: { node: FileNode }) {
    return (
      <div style={{ marginLeft: "12px" }}>
        <div
          style={{ cursor: "pointer", padding: "2px" }}
          onClick={() => {
            if (node.isDir) toggleFolder(node);
            else handleOpenFileFromTree(node.path);
          }}
        >
          {node.isDir ? (node.expanded ? "📂" : "📁") : "📄"} {node.name}
        </div>

        {node.expanded &&
          node.children?.map((child) => (
            <TreeNode key={child.path} node={child} />
          ))}
      </div>
    );
  }

  async function handleOpenFolder() {
    const folder = await invoke<string | null>("open_folder_dialog");
    if (!folder) return;

    const children = await loadFolder(folder);

    setTree([
      {
        path: folder,
        name: folder.split("\\").pop()!,
        isDir: true,
        expanded: true,
        children,
      },
    ]);
  }

  async function toggleFolder(node: FileNode) {
    if (!node.isDir) return;

    // Si on ferme
    if (node.expanded) {
      node.expanded = false;
      setTree([...tree]);
      return;
    }

    // Si on ouvre
    const children = await loadFolder(node.path);
    node.children = children;
    node.expanded = true;
    setTree([...tree]);
  }

  async function handleSave() {
    if (!currentPath) return;
    await invoke("save_file", { path: currentPath, content: code });
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Barre d’outils */}
      <div
        style={{
          padding: "4px 8px",
          background: "#111",
          color: "#eee",
          display: "flex",
          gap: 8,
        }}
      >
        <button onClick={handleOpen}>Ouvrir</button>
        <button onClick={handleSave} disabled={!currentPath}>
          Sauvegarder
        </button>
        <button onClick={() => setTerminalVisible((v) => !v)}>
          {terminalVisible ? "Fermer terminal" : "Ouvrir terminal"}
        </button>
        <select
          value={terminalPosition}
          onChange={(e) =>
            setTerminalPosition(e.target.value as "bottom" | "right")
          }
          style={{ marginLeft: 20 }}
        >
          <option value="bottom">Terminal en bas</option>
          <option value="right">Terminal à droite</option>
        </select>
        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          {currentPath ?? "Nouveau fichier"}
        </span>
      </div>

      {/* ✅ Zone principale : SIDEBAR + (ÉDITEUR + TERMINAL) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {/* ✅ SIDEBAR */}
        <div
          style={{
            width: "250px",
            background: "#1e1e1e",
            color: "#ccc",
            padding: "8px",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <button onClick={handleOpenFolder}>Ouvrir un dossier</button>
          {tree.map((node) => (
            <TreeNode key={node.path} node={node} />
          ))}
        </div>

        {/* ✅ ÉDITEUR + TERMINAL */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: terminalPosition === "right" ? "row" : "column",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {/* ✅ ÉDITEUR */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Suspense
              fallback={<div style={{ color: "white" }}>Chargement...</div>}
            >
              <LazyCodeEditor value={code} onChange={setCode} />
            </Suspense>
          </div>

          {/* ✅ Terminal à droite */}
          {terminalVisible && terminalPosition === "right" && (
            <>
              <div
                style={{
                  width: "5px",
                  cursor: "col-resize",
                  background: "#333",
                  flexShrink: 0,
                  zIndex: 10,
                }}
                onMouseDown={startResizeRight}
              />
              <div
                style={{
                  width: terminalWidth,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Terminal
                  output={terminalOutput}
                  input={terminalInput}
                  setInput={setTerminalInput}
                  onRun={handleRunCommand}
                />
              </div>
            </>
          )}

          {/* ✅ Terminal en bas */}
          {terminalVisible && terminalPosition === "bottom" && (
            <>
              <div
                style={{
                  height: "5px",
                  cursor: "row-resize",
                  background: "#333",
                  flexShrink: 0,
                  zIndex: 10,
                }}
                onMouseDown={startResizeBottom}
              />
              <div
                style={{
                  height: terminalHeight,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Terminal
                  output={terminalOutput}
                  input={terminalInput}
                  setInput={setTerminalInput}
                  onRun={handleRunCommand}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
