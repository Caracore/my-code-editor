import "./styles/layout.css";
import TitleBar from "./components/TitleBar";
import ActivityBar from "./components/ActivityBar";
import Sidebar from "./components/Sidebar";
import EditorTabs from "./components/EditorTabs";
import EditorArea from "./components/EditorArea";
import RightPanel from "./components/RightPanel";
import BottomPanel from "./components/BottomPanel";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";

export default function App() {
  return (
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
  );
}
