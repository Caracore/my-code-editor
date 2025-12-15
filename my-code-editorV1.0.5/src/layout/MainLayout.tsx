import Sidebar from "../components/Sidebar/Sidebar";
import Toolbar from "../components/Toolbar/Toolbar";
import Terminal from "../components/Terminal/Terminal";
import ResizeHandle from "../components/Terminal/ResizeHandle";
import { Suspense, useState } from "react";
import ThemeManager from "../components/ThemeManager/ThemeManager";
import TopMenu from "../components/TopMenu/TopMenu";
import { useTabs } from "../context/TabsContext";

import TabsBar from "../components/TabsBar/TabsBar";

import "./MainLayout.css";
import { useTheme } from "../context/ThemeContext";

interface MainLayoutProps {
  tree: any[];
  sidebarVisible: boolean;
  onRenameFile: (oldPath: string, newName: string) => void;
  onCreateFile: (name: string) => void;
  onOpenFolder: () => void;
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
  onToggleTerminal: () => void;
  onChangeTerminalPosition: (pos: "bottom" | "right") => void;
  LazyCodeEditor: React.ComponentType<any>;
  onOpenFileFromTree: (path: string) => void;
  toggleFolder: (node: any) => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onTrashFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCreateFileFromContext: (folder: string, name: string) => void;
  onCreateFolderFromContext: (folder: string, name: string) => void;
}

export default function MainLayout({
  tree,
  sidebarVisible,
  onRenameFile,
  onCreateFile,
  onOpenFolder,
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
  onToggleTerminal,
  onChangeTerminalPosition,
  LazyCodeEditor,
  onOpenFileFromTree,
  toggleFolder,
  onHistoryUp,
  onHistoryDown,
  onTrashFile,
  onDeleteFile,
  onCreateFileFromContext,
  onCreateFolderFromContext,
}: MainLayoutProps) {
  const { themeName, setThemeName, currentTheme } = useTheme();
  const { tabs, activeTab } = useTabs();

  const activeModel = tabs.find((t) => t.path === activeTab)?.model ?? null;
  const [showThemeManager, setShowThemeManager] = useState(false);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Menu */}
      <TopMenu />

      {/* Toolbar */}
      <Toolbar
        terminalVisible={terminalVisible}
        terminalPosition={terminalPosition}
        onCreateFile={onCreateFile}
        onToggleTerminal={onToggleTerminal}
        onChangeTerminalPosition={onChangeTerminalPosition}
        terminalShell={terminalShell}
        setTerminalShell={setTerminalShell}
        theme={themeName}
        setTheme={setThemeName}
        onOpenThemeManager={() => setShowThemeManager((v) => !v)}
      />

      {showThemeManager && <ThemeManager />}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0 }}>
        {/* Sidebar */}
        <Sidebar
          tree={tree}
          sidebarVisible={sidebarVisible}
          onOpenFile={onOpenFileFromTree}
          onRenameFile={onRenameFile}
          onOpenFolder={onOpenFolder}
          onCreateFile={onCreateFile}
          onToggleFolder={toggleFolder}
          onTrashFile={onTrashFile}
          onDeleteFile={onDeleteFile}
          onCreateFileFromContext={onCreateFileFromContext}
          onCreateFolderFromContext={onCreateFolderFromContext}
        />

        {/* Editor + Terminal */}
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
          {/* Tabs bar */}
          <TabsBar />

          {/* Editor */}
          <div
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}
          >
            <Suspense
              fallback={<div style={{ color: "white" }}>Chargement...</div>}
            >
              <LazyCodeEditor
                model={activeModel}
                theme={themeName}
                customTheme={currentTheme}
              />
            </Suspense>
          </div>

          {/* Terminal RIGHT */}
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
                  terminalShell={terminalShell}
                  setTerminalShell={setTerminalShell}
                  onHistoryUp={onHistoryUp}
                  onHistoryDown={onHistoryDown}
                />
              </div>
            </>
          )}

          {/* Terminal BOTTOM */}
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
                  terminalShell={terminalShell}
                  setTerminalShell={setTerminalShell}
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
