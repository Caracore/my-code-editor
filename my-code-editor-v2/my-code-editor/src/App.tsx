import "./styles/theme.css";
import "./styles/layout.css";

import TitleBar from "./components/TitleBar/TitleBar";
import ActivityBar from "./components/ActivityBar/ActivityBar";
import Sidebar from "./components/Sidebar/Sidebar";
import EditorTabs from "./components/EditorTabs/EditorTabs";
import EditorArea from "./components/CodeMirror6/EditorArea";
import RightPanel from "./components/RightPanel/RightPanel";
import BottomPanel from "./components/BottomPanel/BottomPanel";
import StatusBar from "./components/StatusBar/StatusBar";
import CommandPalette from "./components/CommandPalette/CommandPalette";
import { WorkspaceProvider } from "./context/WorkspaceContext";

export default function App() {
  return (
    <WorkspaceProvider>
      <div className="app">
        <TitleBar />
        <div className="app__body">
          <ActivityBar />
          <Sidebar />
          <main className="app__main">
            <div className="app__editor-area">
              <EditorTabs />
              <EditorArea />
            </div>
            <BottomPanel />
          </main>
          <RightPanel />
        </div>
        <StatusBar />
        <CommandPalette />
      </div>
    </WorkspaceProvider>
  );
}
