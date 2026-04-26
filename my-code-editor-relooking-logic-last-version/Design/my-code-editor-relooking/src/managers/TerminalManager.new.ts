interface TerminalInstance {
  id: string;
  name: string;
  history: string[];
  historyIndex: number;
  buffer: string;
}

export class TerminalManager {
  private terminals: Map<string, TerminalInstance> = new Map();
  private activeTerminalId: string | null = null;
  private nextId: number = 1;

  // Crée un nouveau terminal
  createTerminal(name?: string): string {
    const id = `terminal-${this.nextId++}`;
    const terminalName = name || `Terminal ${this.nextId - 1}`;
    
    this.terminals.set(id, {
      id,
      name: terminalName,
      history: [],
      historyIndex: -1,
      buffer: "",
    });

    if (!this.activeTerminalId) {
      this.activeTerminalId = id;
    }

    return id;
  }

  // Supprime un terminal
  removeTerminal(id: string) {
    this.terminals.delete(id);
    if (this.activeTerminalId === id) {
      const remaining = Array.from(this.terminals.keys());
      this.activeTerminalId = remaining.length > 0 ? remaining[0] : null;
    }
  }

  // Récupère un terminal
  getTerminal(id: string): TerminalInstance | undefined {
    return this.terminals.get(id);
  }

  // Liste tous les terminaux
  getAllTerminals(): TerminalInstance[] {
    return Array.from(this.terminals.values());
  }

  // Active un terminal
  setActiveTerminal(id: string) {
    if (this.terminals.has(id)) {
      this.activeTerminalId = id;
    }
  }

  // Récupère le terminal actif
  getActiveTerminal(): TerminalInstance | null {
    return this.activeTerminalId ? this.terminals.get(this.activeTerminalId) || null : null;
  }

  // Renomme un terminal
  renameTerminal(id: string, newName: string) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.name = newName;
    }
  }

  // Ajoute du texte au buffer (output du PTY)
  appendOutput(id: string, text: string) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.buffer += text;
    }
  }

  // Retourne tout le buffer
  getOutput(id: string): string {
    const terminal = this.terminals.get(id);
    return terminal ? terminal.buffer : "";
  }

  // Ajoute une commande à l'historique
  pushHistory(id: string, cmd: string) {
    const terminal = this.terminals.get(id);
    if (!terminal || cmd.trim().length === 0) return;
    
    terminal.history.push(cmd);
    terminal.historyIndex = terminal.history.length;
  }

  // Récupère commande précédente
  previousHistory(id: string): string {
    const terminal = this.terminals.get(id);
    if (!terminal || terminal.history.length === 0) return "";
    
    terminal.historyIndex = Math.max(0, terminal.historyIndex - 1);
    return terminal.history[terminal.historyIndex];
  }

  // Récupère commande suivante
  nextHistory(id: string): string {
    const terminal = this.terminals.get(id);
    if (!terminal || terminal.history.length === 0) return "";
    
    terminal.historyIndex = Math.min(terminal.history.length, terminal.historyIndex + 1);
    return terminal.historyIndex === terminal.history.length
      ? ""
      : terminal.history[terminal.historyIndex];
  }

  // Reset complet d'un terminal
  reset(id: string) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.buffer = "";
      terminal.history = [];
      terminal.historyIndex = -1;
    }
  }
}
