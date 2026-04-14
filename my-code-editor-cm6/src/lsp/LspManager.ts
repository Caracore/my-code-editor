import { LspClient } from "./LspClient";
import { LSP_CONFIGS } from "./types";
import type { Diagnostic, Range, InlayHint } from "./types";

type DiagnosticsCallback = (filePath: string, diagnostics: Diagnostic[]) => void;

export class LspManager {
  private clients: Map<string, LspClient> = new Map();
  private rootPath: string = "";
  private diagnosticsCallbacks: DiagnosticsCallback[] = [];
  private openDocuments: Map<string, { language: string; content: string }> = new Map();

  setRootPath(path: string): void {
    this.rootPath = path;
  }

  getRootPath(): string {
    return this.rootPath;
  }

  async startServer(language: string): Promise<boolean> {
    if (this.clients.has(language)) {
      console.log(`[LspManager] ${language} server already running`);
      return true;
    }

    const config = LSP_CONFIGS[language];
    if (!config) {
      console.warn(`[LspManager] No LSP config for language: ${language}`);
      return false;
    }

    if (!this.rootPath) {
      console.warn(`[LspManager] No root path set, cannot start LSP server`);
      return false;
    }

    const client = new LspClient(language, this.rootPath);
    
    // Subscribe to diagnostics
    client.onDiagnostics((filePath, diagnostics) => {
      this.diagnosticsCallbacks.forEach((cb) => cb(filePath, diagnostics));
    });

    const success = await client.start(config);
    if (success) {
      this.clients.set(language, client);
      console.log(`[LspManager] Started ${language} server`);

      // Re-open any documents for this language
      for (const [path, doc] of this.openDocuments) {
        if (doc.language === language) {
          await client.openDocument(path, doc.content);
        }
      }
    }

    return success;
  }

  async stopServer(language: string): Promise<void> {
    const client = this.clients.get(language);
    if (client) {
      await client.stop();
      this.clients.delete(language);
      console.log(`[LspManager] Stopped ${language} server`);
    }
  }

  async stopAllServers(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((lang) => this.stopServer(lang));
    await Promise.all(promises);
  }

  getClient(language: string): LspClient | undefined {
    return this.clients.get(language);
  }

  isServerRunning(language: string): boolean {
    const client = this.clients.get(language);
    return client?.isInitialized() ?? false;
  }

  // Document management

  async openDocument(filePath: string, language: string, content: string): Promise<void> {
    this.openDocuments.set(filePath, { language, content });

    // Try to start server if not running
    if (!this.clients.has(language) && LSP_CONFIGS[language]) {
      await this.startServer(language);
    }

    const client = this.clients.get(language);
    if (client?.isInitialized()) {
      await client.openDocument(filePath, content);
    }
  }

  async updateDocument(filePath: string, content: string): Promise<void> {
    const doc = this.openDocuments.get(filePath);
    if (!doc) return;

    doc.content = content;

    const client = this.clients.get(doc.language);
    if (client?.isInitialized()) {
      await client.updateDocument(filePath, content);
    }
  }

  async closeDocument(filePath: string): Promise<void> {
    const doc = this.openDocuments.get(filePath);
    if (!doc) return;

    this.openDocuments.delete(filePath);

    const client = this.clients.get(doc.language);
    if (client?.isInitialized()) {
      await client.closeDocument(filePath);
    }
  }

  async saveDocument(filePath: string, content?: string): Promise<void> {
    const doc = this.openDocuments.get(filePath);
    if (!doc) return;

    const client = this.clients.get(doc.language);
    if (client?.isInitialized()) {
      await client.saveDocument(filePath, content);
    }
  }

  // Diagnostics

  onDiagnostics(callback: DiagnosticsCallback): () => void {
    this.diagnosticsCallbacks.push(callback);
    return () => {
      const index = this.diagnosticsCallbacks.indexOf(callback);
      if (index > -1) {
        this.diagnosticsCallbacks.splice(index, 1);
      }
    };
  }

  // Inlay Hints

  async getInlayHints(filePath: string, range: Range): Promise<InlayHint[]> {
    const doc = this.openDocuments.get(filePath);
    if (!doc) return [];

    const client = this.clients.get(doc.language);
    if (!client?.isInitialized()) return [];

    return client.getInlayHints(filePath, range);
  }

  // Get language from file extension
  getLanguageFromPath(filePath: string): string | null {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "py":
        return "python";
      case "rs":
        return "rust";
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      default:
        return null;
    }
  }
}

// Singleton instance
export const lspManager = new LspManager();
