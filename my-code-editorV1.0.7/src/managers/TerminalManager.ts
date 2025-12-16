export class TerminalManager {
  private history: string[] = [];
  private historyIndex: number = -1;
  private buffer: string = "";

  // Ajoute du texte au buffer (output du PTY)
  appendOutput(text: string) {
    this.buffer += text;
  }

  // Retourne tout le buffer
  getOutput() {
    return this.buffer;
  }

  // Ajoute une commande à l’historique
  pushHistory(cmd: string) {
    if (cmd.trim().length === 0) return;
    this.history.push(cmd);
    this.historyIndex = this.history.length;
  }

  // Récupère commande précédente
  previousHistory(): string {
    if (this.history.length === 0) return "";
    this.historyIndex = Math.max(0, this.historyIndex - 1);
    return this.history[this.historyIndex];
  }

  // Récupère commande suivante
  nextHistory(): string {
    if (this.history.length === 0) return "";
    this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
    return this.historyIndex === this.history.length
      ? ""
      : this.history[this.historyIndex];
  }

  // Reset complet (si tu changes de shell par exemple)
  reset() {
    this.buffer = "";
    this.history = [];
    this.historyIndex = -1;
  }
}
