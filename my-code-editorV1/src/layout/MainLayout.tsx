import Sidebar from "../components/Sidebar/Sidebar";
import Toolbar from "../components/Toolbar/Toolbar";
import Terminal from "../components/Terminal/Terminal";
import ResizeHandle from "../components/Terminal/ResizeHandle";
import { Suspense } from "react";

interface MainLayoutProps {
  tree: any[];
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
  onOpen: () => void;
  onSave: () => void;
  onToggleTerminal: () => void;
  onChangeTerminalPosition: (pos: "bottom" | "right") => void;
  code: string;
  setCode: (value: string) => void;
  LazyCodeEditor: React.ComponentType<any>;
  onOpenFileFromTree: (path: string) => void;
  toggleFolder: (node: any) => void;
}

export default function MainLayout({
  tree,
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
  onOpen,
  onSave,
  onToggleTerminal,
  onChangeTerminalPosition,
  code,
  setCode,
  LazyCodeEditor,
  onOpenFileFromTree,
  toggleFolder,
}: MainLayoutProps) {
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
      />

      {/* ✅ Main content */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0 }}>
        {/* ✅ Sidebar */}
        <Sidebar
          tree={tree}
          onOpenFolder={onOpenFolder}
          onCreateFile={onCreateFile}
          onOpenFile={onOpenFileFromTree}
          onToggleFolder={toggleFolder}
        />

        {/* ✅ Editor + Terminal */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: terminalPosition === "right" ? "row" : "column",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {/* ✅ Editor */}
          <div
            style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}
          >
            <Suspense
              fallback={<div style={{ color: "white" }}>Chargement...</div>}
            >
              <LazyCodeEditor value={code} onChange={setCode} />
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
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
