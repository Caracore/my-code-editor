import { useTerminalManager } from "../../context/TerminalContext";
import "./TerminalTabs.css";

interface TerminalTabsProps {
  activeTerminalId: string | null;
  onSelectTerminal: (id: string) => void;
  onNewTerminal: () => void;
  onCloseTerminal: (id: string) => void;
}

export default function TerminalTabs({
  activeTerminalId,
  onSelectTerminal,
  onNewTerminal,
  onCloseTerminal,
}: TerminalTabsProps) {
  const terminalManager = useTerminalManager();
  const terminals = terminalManager.getAllTerminals();

  return (
    <div className="terminal-tabs">
      <div className="terminal-tabs-list">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={`terminal-tab ${terminal.id === activeTerminalId ? "active" : ""}`}
            onClick={() => onSelectTerminal(terminal.id)}
          >
            <span className="terminal-tab-name">{terminal.name}</span>
            <button
              className="terminal-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTerminal(terminal.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button className="terminal-new-btn" onClick={onNewTerminal} title="New Terminal">
        +
      </button>
    </div>
  );
}
