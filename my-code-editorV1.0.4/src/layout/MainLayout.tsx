import Sidebar from "../components/Sidebar/Sidebar";
import Toolbar from "../components/Toolbar/Toolbar";
import Terminal from "../components/Terminal/Terminal";
import ResizeHandle from "../components/Terminal/ResizeHandle";
import { Suspense, useState } from "react";
import ThemeManager from "../components/ThemeManager/ThemeManager";

import "./MainLayout.css";
// import type { ThemeName } from "../types/theme";
import { useTheme } from "../context/ThemeContext";

interface MainLayoutProps {
  tree: any[];
  // setTheme: (value: ThemeName) => void;
  // theme: ThemeName;
  onRenameFile: (oldPath: string, newName: string) => void;
  onCreateFile: (name: string) => void;
  onOpenFolder: () => void;
  currentPath: string | null;
  terminalVisible: boolean;
  terminalPosition: "bottom" | "right";
  terminalWidth: number;
  terminalHeight: number;
  startResizeRight: (e: React.MouseEvent) => void;
  startResizeBottom: (e: React.MouseEvent) => void;
  terminalOutput: string;
  terminalInput: string;
  setTerminalInput: (value: string) => void;
  onRunCommand: () => void;
  terminalPrompt: string;
  terminalShell: "cmd" | "bash";
  setTerminalShell: React.Dispatch<React.SetStateAction<"cmd" | "bash">>;
  onOpen: () => void;
  onSave: () => void;
  onToggleTerminal: () => void;
  onChangeTerminalPosition: (pos: "bottom" | "right") => void;
  code: string;
  setCode: (value: string) => void;
  LazyCodeEditor: React.ComponentType<any>;
  onOpenFileFromTree: (path: string) => void;
  toggleFolder: (node: any) => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onTrashFile: (path: string) => void; // ✅ AJOUT
  onDeleteFile: (path: string) => void;
}

export default function MainLayout({
  tree,
  // theme,
  // setTheme,
  onRenameFile,
  onCreateFile,
  onOpenFolder,
  currentPath,
  terminalVisible,
  terminalPosition,
  terminalWidth,
  terminalHeight,
  startResizeRight,
  startResizeBottom,
  terminalOutput,
  terminalInput,
  setTerminalInput,
  onRunCommand,
  terminalShell,
  setTerminalShell,
  terminalPrompt,
  onOpen,
  onSave,
  onToggleTerminal,
  onChangeTerminalPosition,
  code,
  setCode,
  LazyCodeEditor,
  onOpenFileFromTree,
  toggleFolder,
  onHistoryUp,
  onHistoryDown,
  onTrashFile,
  onDeleteFile,
}: MainLayoutProps) {
  // const { themeName, setThemeName } = useTheme();
  // const { themeName, currentTheme } = useTheme();
  const { themeName, setThemeName, currentTheme } = useTheme();
  const [showThemeManager, setShowThemeManager] = useState(false);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ✅ Toolbar */}
      <Toolbar
        currentPath={currentPath}
        terminalVisible={terminalVisible}
        terminalPosition={terminalPosition}
        onCreateFile={onCreateFile}
        onOpen={onOpen}
        onSave={onSave}
        onToggleTerminal={onToggleTerminal}
        onChangeTerminalPosition={onChangeTerminalPosition}
        terminalShell={terminalShell}
        setTerminalShell={setTerminalShell}
        // ✅ Themes :
        theme={themeName}
        setTheme={setThemeName}
        onOpenThemeManager={() => setShowThemeManager((v) => !v)}
      />
      {showThemeManager && <ThemeManager />}
      {/* ✅ Main content */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0 }}>
        {/* ✅ Sidebar */}
        <Sidebar
          tree={tree}
          onRenameFile={onRenameFile}
          onOpenFolder={onOpenFolder}
          onCreateFile={onCreateFile}
          onOpenFile={onOpenFileFromTree}
          onToggleFolder={toggleFolder}
          onTrashFile={onTrashFile} // ✅ AJOUT
          onDeleteFile={onDeleteFile}
        />

        {/* ✅ Editor + Terminal */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: terminalPosition === "right" ? "row" : "column",
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* ✅ Editor */}
          <div
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}
          >
            <Suspense
              fallback={<div style={{ color: "white" }}>Chargement...</div>}
            >
              <LazyCodeEditor
                value={code}
                path={currentPath} // ✅ indispensable !
                onChange={setCode}
                theme={themeName}
                customTheme={currentTheme} // ✅ AJOUT CRUCIAL
              />
            </Suspense>
          </div>

          {/* ✅ Terminal RIGHT */}
          {terminalVisible && terminalPosition === "right" && (
            <>
              <ResizeHandle
                direction="horizontal"
                onMouseDown={startResizeRight}
              />
              <div style={{ width: terminalWidth, flexShrink: 0 }}>
                <Terminal
                  output={terminalOutput}
                  input={terminalInput}
                  setInput={setTerminalInput}
                  onRun={onRunCommand}
                  terminalPrompt={terminalPrompt}
                  terminalShell={terminalShell} // ✅ AJOUTER
                  setTerminalShell={setTerminalShell} // ✅ AJOUTER
                  onHistoryUp={onHistoryUp}
                  onHistoryDown={onHistoryDown}
                />
              </div>
            </>
          )}

          {/* ✅ Terminal BOTTOM */}
          {terminalVisible && terminalPosition === "bottom" && (
            <>
              <ResizeHandle
                direction="vertical"
                onMouseDown={startResizeBottom}
              />
              <div style={{ height: terminalHeight, flexShrink: 0 }}>
                <Terminal
                  output={terminalOutput}
                  input={terminalInput}
                  setInput={setTerminalInput}
                  onRun={onRunCommand}
                  terminalPrompt={terminalPrompt}
                  terminalShell={terminalShell} // ✅ AJOUTER
                  setTerminalShell={setTerminalShell} // ✅ AJOUTER
                  onHistoryUp={onHistoryUp}
                  onHistoryDown={onHistoryDown}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
