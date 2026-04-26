import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type {
  LspServerConfig,
  InitializeParams,
  InitializeResult,
  TextDocumentItem,
  Position,
  Range,
  CompletionItem,
  CompletionList,
  Hover,
  Location,
  LocationLink,
  Diagnostic,
  PublishDiagnosticsParams,
  TextDocumentContentChangeEvent,
  JsonRpcResponse,
  JsonRpcNotification,
  InlayHint,
} from "./types";

export class LspClient {
  private serverId: string;
  private language: string;
  private rootPath: string;
  private initialized = false;
  private pendingRequests: Map<number, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private diagnosticsCallbacks: ((uri: string, diagnostics: Diagnostic[]) => void)[] = [];
  private unlisten: UnlistenFn | null = null;
  private documentVersions: Map<string, number> = new Map();

  constructor(language: string, rootPath: string) {
    this.language = language;
    this.rootPath = rootPath;
    this.serverId = `${language}-${Date.now()}`;
  }

  async start(config: Omit<LspServerConfig, "root_path">): Promise<boolean> {
    try {
      // Listen for LSP messages
      this.unlisten = await listen<{ server_id: string; message: JsonRpcResponse | JsonRpcNotification }>(
        "lsp-message",
        (event) => {
          if (event.payload.server_id === this.serverId) {
            this.handleMessage(event.payload.message);
          }
        }
      );

      // Start LSP server via Tauri
      await invoke("start_lsp", {
        serverId: this.serverId,
        config: {
          ...config,
          root_path: this.rootPath,
        },
      });

      // Initialize LSP
      await this.initialize();
      return true;
    } catch (error) {
      console.error(`[LSP ${this.language}] Failed to start:`, error);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.unlisten) {
      this.unlisten();
      this.unlisten = null;
    }

    try {
      await invoke("stop_lsp", { serverId: this.serverId });
    } catch (error) {
      console.error(`[LSP ${this.language}] Failed to stop:`, error);
    }

    this.initialized = false;
    this.pendingRequests.clear();
  }

  private async initialize(): Promise<void> {
    const params: InitializeParams = {
      processId: null,
      rootUri: this.pathToUri(this.rootPath),
      capabilities: {
        textDocument: {
          synchronization: {
            didSave: true,
          },
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ["markdown", "plaintext"],
            },
          },
          hover: {
            contentFormat: ["markdown", "plaintext"],
          },
          publishDiagnostics: {
            relatedInformation: true,
          },
          inlayHint: {
            dynamicRegistration: true,
          },
        },
        workspace: {
          workspaceFolders: true,
        },
      },
      workspaceFolders: [
        {
          uri: this.pathToUri(this.rootPath),
          name: this.rootPath.split(/[/\\]/).pop() || "workspace",
        },
      ],
    };

    const result = await this.sendRequest<InitializeResult>("initialize", params);
    console.log(`[LSP ${this.language}] Initialized with capabilities:`, result?.capabilities);

    // Send initialized notification
    await this.sendNotification("initialized", {});
    this.initialized = true;
  }

  private handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    // Response to a request
    if ("id" in message && message.id !== null) {
      const pending = this.pendingRequests.get(message.id as number);
      if (pending) {
        this.pendingRequests.delete(message.id as number);
        if ("error" in message && message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
      return;
    }

    // Notification from server
    if ("method" in message) {
      this.handleNotification(message as JsonRpcNotification);
    }
  }

  private handleNotification(notification: JsonRpcNotification): void {
    switch (notification.method) {
      case "textDocument/publishDiagnostics": {
        const params = notification.params as PublishDiagnosticsParams;
        const filePath = this.uriToPath(params.uri);
        this.diagnosticsCallbacks.forEach((cb) => cb(filePath, params.diagnostics));
        break;
      }
      case "window/logMessage":
      case "window/showMessage":
        console.log(`[LSP ${this.language}]`, notification.params);
        break;
    }
  }

  private async sendRequest<T>(method: string, params: unknown): Promise<T | null> {
    try {
      const requestId = await invoke<number>("send_lsp_request", {
        serverId: this.serverId,
        method,
        params,
      });

      return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request ${method} timed out`));
        }, 30000);

        this.pendingRequests.set(requestId, {
          resolve: (result) => {
            clearTimeout(timeout);
            resolve(result as T);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error(`[LSP ${this.language}] Request ${method} failed:`, error);
      return null;
    }
  }

  private async sendNotification(method: string, params: unknown): Promise<void> {
    try {
      await invoke("send_lsp_notification", {
        serverId: this.serverId,
        method,
        params,
      });
    } catch (error) {
      console.error(`[LSP ${this.language}] Notification ${method} failed:`, error);
    }
  }

  // Public API

  async openDocument(filePath: string, text: string): Promise<void> {
    if (!this.initialized) return;

    const version = 1;
    this.documentVersions.set(filePath, version);

    const item: TextDocumentItem = {
      uri: this.pathToUri(filePath),
      languageId: this.language,
      version,
      text,
    };

    await this.sendNotification("textDocument/didOpen", { textDocument: item });
  }

  async updateDocument(filePath: string, text: string): Promise<void> {
    if (!this.initialized) return;

    const version = (this.documentVersions.get(filePath) || 0) + 1;
    this.documentVersions.set(filePath, version);

    const changes: TextDocumentContentChangeEvent[] = [{ text }];

    await this.sendNotification("textDocument/didChange", {
      textDocument: {
        uri: this.pathToUri(filePath),
        version,
      },
      contentChanges: changes,
    });
  }

  async closeDocument(filePath: string): Promise<void> {
    if (!this.initialized) return;

    this.documentVersions.delete(filePath);

    await this.sendNotification("textDocument/didClose", {
      textDocument: { uri: this.pathToUri(filePath) },
    });
  }

  async saveDocument(filePath: string, text?: string): Promise<void> {
    if (!this.initialized) return;

    await this.sendNotification("textDocument/didSave", {
      textDocument: { uri: this.pathToUri(filePath) },
      text,
    });
  }

  async getCompletions(
    filePath: string,
    position: Position
  ): Promise<CompletionItem[]> {
    if (!this.initialized) return [];

    const result = await this.sendRequest<CompletionList | CompletionItem[]>(
      "textDocument/completion",
      {
        textDocument: { uri: this.pathToUri(filePath) },
        position,
      }
    );

    if (!result) return [];
    return Array.isArray(result) ? result : result.items;
  }

  async getHover(filePath: string, position: Position): Promise<Hover | null> {
    if (!this.initialized) return null;

    return this.sendRequest<Hover>("textDocument/hover", {
      textDocument: { uri: this.pathToUri(filePath) },
      position,
    });
  }

  async getDefinition(
    filePath: string,
    position: Position
  ): Promise<Location[]> {
    if (!this.initialized) return [];

    const result = await this.sendRequest<
      Location | Location[] | LocationLink[] | null
    >("textDocument/definition", {
      textDocument: { uri: this.pathToUri(filePath) },
      position,
    });

    if (!result) return [];
    const arr = Array.isArray(result) ? result : [result];
    return arr.map((item) => {
      if ("targetUri" in item) {
        return {
          uri: item.targetUri,
          range: item.targetSelectionRange ?? item.targetRange,
        };
      }
      return item;
    });
  }

  async getInlayHints(filePath: string, range: Range): Promise<InlayHint[]> {
    if (!this.initialized) return [];

    const result = await this.sendRequest<InlayHint[] | null>("textDocument/inlayHint", {
      textDocument: { uri: this.pathToUri(filePath) },
      range,
    });

    return result || [];
  }

  onDiagnostics(callback: (uri: string, diagnostics: Diagnostic[]) => void): () => void {
    this.diagnosticsCallbacks.push(callback);
    return () => {
      const index = this.diagnosticsCallbacks.indexOf(callback);
      if (index > -1) {
        this.diagnosticsCallbacks.splice(index, 1);
      }
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Helpers

  private pathToUri(filePath: string): string {
    // Convert Windows path to file URI
    const normalizedPath = filePath.replace(/\\/g, "/");
    if (normalizedPath.match(/^[a-zA-Z]:/)) {
      return `file:///${normalizedPath}`;
    }
    return `file://${normalizedPath}`;
  }

  private uriToPath(uri: string): string {
    let path = uri.replace(/^file:\/\/\/?/, "");
    // On Windows, handle drive letters
    if (path.match(/^[a-zA-Z]%3A/i)) {
      path = decodeURIComponent(path);
    }
    return path.replace(/\//g, "\\");
  }
}
