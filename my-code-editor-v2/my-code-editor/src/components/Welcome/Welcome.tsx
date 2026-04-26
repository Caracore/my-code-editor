import { Logo, I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import "./Welcome.css";

export default function Welcome() {
  const { openFolder, rootPath } = useWorkspace();

  return (
    <div className="welcome">
      <div className="welcome__inner">
        <header className="welcome__header">
          <div className="welcome__logo">
            <Logo size={56} />
          </div>
          <h1 className="welcome__title">my-code-editor</h1>
          <p className="welcome__subtitle">
            A blazing-fast, minimal IDE built with Tauri, React &amp; CodeMirror 6.
          </p>
        </header>

        <section className="welcome__grid">
          <div className="welcome__col">
            <h2 className="welcome__col-title">Start</h2>
            <ul className="welcome__list">
              <li>
                <button className="welcome__action" onClick={() => openFolder()}>
                  <I.Folder size={16} />
                  <span>
                    <strong>Open Folder…</strong>
                    <em>Pick a project directory to load it into the sidebar</em>
                  </span>
                  <kbd>Ctrl+K Ctrl+O</kbd>
                </button>
              </li>
              <li>
                <button
                  className="welcome__action"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("menu-action", { detail: "file:new" }),
                    )
                  }
                >
                  <I.Plus size={16} />
                  <span>
                    <strong>New File</strong>
                    <em>Start typing in a fresh untitled buffer</em>
                  </span>
                  <kbd>Ctrl+N</kbd>
                </button>
              </li>
              <li>
                <button
                  className="welcome__action"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("menu-action", {
                        detail: "view:command-palette",
                      }),
                    )
                  }
                >
                  <I.Search size={16} />
                  <span>
                    <strong>Command Palette</strong>
                    <em>Run any IDE command from a single prompt</em>
                  </span>
                  <kbd>Ctrl+Shift+P</kbd>
                </button>
              </li>
            </ul>
          </div>

          <div className="welcome__col">
            <h2 className="welcome__col-title">Recent</h2>
            {rootPath ? (
              <ul className="welcome__list">
                <li>
                  <button
                    className="welcome__action"
                    onClick={() => openFolder(rootPath)}
                  >
                    <I.FolderOpen size={16} />
                    <span>
                      <strong>{rootPath.split(/[\\/]/).pop()}</strong>
                      <em>{rootPath}</em>
                    </span>
                  </button>
                </li>
              </ul>
            ) : (
              <p className="welcome__empty">
                No recent folder yet. Open a folder to get started.
              </p>
            )}

            <h2 className="welcome__col-title welcome__col-title--mt">Tips</h2>
            <ul className="welcome__tips">
              <li>
                <kbd>Ctrl+P</kbd> Quick file navigation
              </li>
              <li>
                <kbd>Ctrl+B</kbd> Toggle the sidebar
              </li>
              <li>
                <kbd>Ctrl+J</kbd> Toggle the bottom panel
              </li>
              <li>
                <kbd>Ctrl+S</kbd> Save the active file
              </li>
            </ul>
          </div>
        </section>

        <footer className="welcome__footer">
          <span>v0.2.0</span>
          <span className="welcome__footer-dot">•</span>
          <span>Tauri 2 · React 19 · CodeMirror 6</span>
        </footer>
      </div>
    </div>
  );
}

