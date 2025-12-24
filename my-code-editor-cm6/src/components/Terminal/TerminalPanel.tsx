import { useState, useEffect, useRef, type ReactElement } from "react";
import { invoke } from "@tauri-apps/api/core";
import Terminal from "./Terminal";
import TerminalTabs from "./TerminalTabs";
import { useTerminalManager } from "../../context/TerminalContext";
import "./TerminalPanel.css";

interface TerminalPanelProps {
  rootPath: string | null;
}

export default function TerminalPanel({ rootPath }: TerminalPanelProps) {
  const terminalManager = useTerminalManager();
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [, forceUpdate] = useState({});
  const terminalInstancesRef = useRef<Map<string, ReactElement>>(new Map());

  // Créer le premier terminal au montage SEULEMENT s'il n'y en a pas
  useEffect(() => {
    const existingTerminals = terminalManager.getAllTerminals();
    if (existingTerminals.length === 0) {
      const id = terminalManager.createTerminal("Terminal 1");
      setActiveTerminalId(id);
      
      // Changer le répertoire si un dossier est ouvert
      if (rootPath) {
        setTimeout(() => {
          invoke("change_terminal_directory", { id, path: rootPath })
            .then(() => console.log(`✅ Terminal ${id} set to: ${rootPath}`))
            .catch((err) => console.error(`❌ Failed to set directory:`, err));
        }, 500); // Attendre que le terminal soit prêt
      }
    } else {
      // Restaurer le terminal actif ou sélectionner le premier
      const active = terminalManager.getActiveTerminal();
      setActiveTerminalId(active ? active.id : existingTerminals[0].id);
    }
  }, []);

  const handleNewTerminal = () => {
    const terminals = terminalManager.getAllTerminals();
    const id = terminalManager.createTerminal(`Terminal ${terminals.length + 1}`);
    setActiveTerminalId(id);
    
    // Changer le répertoire si un dossier est ouvert
    if (rootPath) {
      setTimeout(() => {
        invoke("change_terminal_directory", { id, path: rootPath })
          .then(() => console.log(`✅ Terminal ${id} set to: ${rootPath}`))
          .catch((err) => console.error(`❌ Failed to set directory:`, err));
      }, 500); // Attendre que le terminal soit prêt
    }
    
    forceUpdate({}); // Force re-render to create new Terminal instance
  };

  const handleCloseTerminal = async (id: string) => {
    try {
      await invoke("stop_terminal", { id });
      terminalManager.removeTerminal(id);
      terminalInstancesRef.current.delete(id);
      
      // Si c'était le terminal actif, sélectionner un autre
      if (activeTerminalId === id) {
        const remaining = terminalManager.getAllTerminals();
        setActiveTerminalId(remaining.length > 0 ? remaining[0].id : null);
      }
      forceUpdate({}); // Force re-render
    } catch (err) {
      console.error("Error closing terminal:", err);
    }
  };

  const handleSelectTerminal = (id: string) => {
    terminalManager.setActiveTerminal(id);
    setActiveTerminalId(id);
  };

  const terminals = terminalManager.getAllTerminals();

  // Créer les instances Terminal uniquement pour les nouveaux terminaux
  terminals.forEach((terminal) => {
    if (!terminalInstancesRef.current.has(terminal.id)) {
      terminalInstancesRef.current.set(
        terminal.id,
        <Terminal key={terminal.id} terminalId={terminal.id} />
      );
    }
  });

  return (
    <div className="terminal-panel">
      <TerminalTabs
        activeTerminalId={activeTerminalId}
        onSelectTerminal={handleSelectTerminal}
        onNewTerminal={handleNewTerminal}
        onCloseTerminal={handleCloseTerminal}
      />
      <div className="terminal-content">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className="terminal-instance"
            style={{ display: terminal.id === activeTerminalId ? "block" : "none" }}
          >
            {terminalInstancesRef.current.get(terminal.id)}
          </div>
        ))}
      </div>
    </div>
  );
}
