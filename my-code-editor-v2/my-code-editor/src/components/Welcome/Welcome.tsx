import type { ReactNode } from "react";
import { Logo, I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import "./Welcome.css";

type Action = {
  icon: ReactNode;
  title: string;
  desc: string;
  shortcut?: string;
  onClick: () => void;
};

export default function Welcome() {
  const { openFolder, rootPath } = useWorkspace();

  const fire = (detail: string) =>
    window.dispatchEvent(new CustomEvent("menu-action", { detail }));

  const startActions: Action[] = [
    {
      icon: <I.Folder size={18} />,
      title: "Open Folder…",
      desc: "Pick a project directory to load it into the sidebar",
      shortcut: "Ctrl+K Ctrl+O",
      onClick: () => openFolder(),
    },
    {
      icon: <I.Plus size={18} />,
      title: "New File",
      desc: "Start typing in a fresh untitled buffer",
      shortcut: "Ctrl+N",
      onClick: () => fire("file:new"),
    },
    {
      icon: <I.Search size={18} />,
      title: "Command Palette",
      desc: "Run any IDE command from a single prompt",
      shortcut: "Ctrl+Shift+P",
      onClick: () => fire("view:command-palette"),
    },
  ];

  const tips = [
    { keys: "Ctrl+P", label: "Quick file navigation" },
    { keys: "Ctrl+B", label: "Toggle the sidebar" },
    { keys: "Ctrl+J", label: "Toggle the bottom panel" },
    { keys: "Ctrl+S", label: "Save the active file" },
  ];

  return (
    <div className="welcome">
      <div className="welcome__scroll">
        <div className="welcome__inner">
          {/* HEADER */}
          <header className="welcome__header">
            <div className="welcome__logo">
              <Logo size={48} />
            </div>
            <div className="welcome__heading">
              <h1 className="welcome__title">my-code-editor</h1>
              <p className="welcome__subtitle">
                A blazing-fast, minimal IDE built with Tauri, React &amp;
                CodeMirror&nbsp;6.
              </p>
            </div>
          </header>

          {/* GRID */}
          <section className="welcome__grid">
            {/* START */}
            <div className="welcome__col">
              <h2 className="welcome__col-title">Start</h2>
              <ul className="welcome__list">
                {startActions.map((a) => (
                  <li key={a.title}>
                    <button className="welcome__action" onClick={a.onClick}>
                      <span className="welcome__action-icon">{a.icon}</span>
                      <span className="welcome__action-text">
                        <strong>{a.title}</strong>
                        <em>{a.desc}</em>
                      </span>
                      {a.shortcut && (
                        <kbd className="welcome__kbd">{a.shortcut}</kbd>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              <h2 className="welcome__col-title welcome__col-title--mt">
                Recent
              </h2>
              {rootPath ? (
                <ul className="welcome__list">
                  <li>
                    <button
                      className="welcome__action"
                      onClick={() => openFolder(rootPath)}
                    >
                      <span className="welcome__action-icon">
                        <I.FolderOpen size={18} />
                      </span>
                      <span className="welcome__action-text">
                        <strong>{rootPath.split(/[\\/]/).pop()}</strong>
                        <em title={rootPath}>{rootPath}</em>
                      </span>
                    </button>
                  </li>
                </ul>
              ) : (
                <p className="welcome__empty">
                  No recent folder yet. Open a folder to get started.
                </p>
              )}
            </div>

            {/* TIPS */}
            <div className="welcome__col">
              <h2 className="welcome__col-title">Tips &amp; Shortcuts</h2>
              <ul className="welcome__tips">
                {tips.map((t) => (
                  <li key={t.keys}>
                    <kbd className="welcome__kbd welcome__kbd--fixed">
                      {t.keys}
                    </kbd>
                    <span>{t.label}</span>
                  </li>
                ))}
              </ul>

              <h2 className="welcome__col-title welcome__col-title--mt">
                Learn
              </h2>
              <ul className="welcome__tips">
                <li>
                  <span className="welcome__bullet" />
                  <span>Open the Command Palette to discover features</span>
                </li>
                <li>
                  <span className="welcome__bullet" />
                  <span>Customize the layout via the activity bar</span>
                </li>
                <li>
                  <span className="welcome__bullet" />
                  <span>Drop a folder into the sidebar to start coding</span>
                </li>
              </ul>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="welcome__footer">
            <span>v0.2.0</span>
            <span className="welcome__footer-dot">•</span>
            <span>Tauri 2 · React 19 · CodeMirror 6</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
