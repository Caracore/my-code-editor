import "./styles/theme.css";
import "./styles/layout.css";

import { useCallback, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TitleBar from "./components/TitleBar/TitleBar";
import ActivityBar from "./components/ActivityBar/ActivityBar";
import Sidebar from "./components/Sidebar/Sidebar";
import EditorArea from "./components/CodeMirror6/EditorArea";
import RightPanel from "./components/RightPanel/RightPanel";
import BottomPanel from "./components/BottomPanel/BottomPanel";
import StatusBar from "./components/StatusBar/StatusBar";
import CommandPalette from "./components/CommandPalette/CommandPalette";
import SettingsPage from "./components/Settings/SettingsPage";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { UserSettingsProvider } from "./context/UserSettingsContext";
import { PluginsProvider } from "./plugins/PluginsContext";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { AppDndProvider } from "./components/dnd/AppDndProvider";

export default function App() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [showBottom, setShowBottom] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSidebar = useCallback(() => setShowSidebar((v) => !v), []);
  const toggleRight = useCallback(() => setShowRight((v) => !v), []);
  const toggleBottom = useCallback(() => setShowBottom((v) => !v), []);
  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const openExtensions = useCallback(() => {
    setShowSettings(true);
    requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent("settings:set-section", { detail: "extensions" })),
    );
  }, []);

  // Centralised shortcut/menu-action handlers. The same actions fire
  // from menus, the command palette, status-bar buttons and shortcuts.
  useAppShortcuts({
    "view:toggle-sidebar": toggleSidebar,
    "view:toggle-right":   toggleRight,
    "view:toggle-bottom":  toggleBottom,
    "tools:terminal": () => {
      setShowBottom(true);
      requestAnimationFrame(() =>
        window.dispatchEvent(new CustomEvent("terminal:focus")),
      );
    },
    "terminal:new": () => {
      setShowBottom(true);
      requestAnimationFrame(() =>
        window.dispatchEvent(new CustomEvent("terminal:new")),
      );
    },
    "view:command-palette": () =>
      window.dispatchEvent(new CustomEvent("commandPalette:open")),
    "nav:file": () =>
      window.dispatchEvent(new CustomEvent("commandPalette:open")),
    "view:fullscreen": () => {
      const w = getCurrentWindow();
      w.isFullscreen()
        .then((isFs) => w.setFullscreen(!isFs))
        .catch(() => {});
    },
    "window:reload": () => window.location.reload(),
    "tools:settings": openSettings,
    "settings:open": openSettings,
  });

  return (
    <UserSettingsProvider>
      <PluginsProvider>
      <WorkspaceProvider>
        <AppDndProvider>
        <div
          className={[
            "app",
            showSidebar ? "" : "app--no-sidebar",
            showRight ? "" : "app--no-right",
            showBottom ? "" : "app--no-bottom",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <TitleBar />
          <div className="app__body">
            <ActivityBar
              sidebarOpen={showSidebar}
              onToggleSidebar={toggleSidebar}
              onOpenSettings={openSettings}
              onOpenExtensions={openExtensions}
            />
            {showSidebar && <Sidebar onClose={toggleSidebar} />}
            <main className="app__main">
              <div className="app__editor-area">
                <EditorArea />
              </div>
              {showBottom && <BottomPanel onClose={toggleBottom} />}
            </main>
            {showRight && <RightPanel onClose={toggleRight} />}
          </div>
          <StatusBar
            terminalOpen={showBottom}
            rightOpen={showRight}
            onToggleTerminal={toggleBottom}
            onToggleRight={toggleRight}
            onOpenSettings={openSettings}
          />
          <CommandPalette />
          {showSettings && <SettingsPage onClose={closeSettings} />}
        </div>
        </AppDndProvider>
      </WorkspaceProvider>
      </PluginsProvider>
    </UserSettingsProvider>
  );
}



