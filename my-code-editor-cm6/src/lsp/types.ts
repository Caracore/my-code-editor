// LSP Protocol Types

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export interface TextDocumentIdentifier {
  uri: string;
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
  version: number;
}

export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface TextDocumentContentChangeEvent {
  range?: Range;
  text: string;
}

// Diagnostics
// DiagnosticSeverity as const object instead of enum
export const DiagnosticSeverity = {
  Error: 1,
  Warning: 2,
  Information: 3,
  Hint: 4,
} as const;
export type DiagnosticSeverity = typeof DiagnosticSeverity[keyof typeof DiagnosticSeverity];

export interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}

export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

export interface PublishDiagnosticsParams {
  uri: string;
  diagnostics: Diagnostic[];
}

// CompletionItemKind as const object instead of enum
export const CompletionItemKind = {
  Text: 1,
  Method: 2,
  Function: 3,
  Constructor: 4,
  Field: 5,
  Variable: 6,
  Class: 7,
  Interface: 8,
  Module: 9,
  Property: 10,
  Unit: 11,
  Value: 12,
  Enum: 13,
  Keyword: 14,
  Snippet: 15,
  Color: 16,
  File: 17,
  Reference: 18,
  Folder: 19,
  EnumMember: 20,
  Constant: 21,
  Struct: 22,
  Event: 23,
  Operator: 24,
  TypeParameter: 25,
} as const;
export type CompletionItemKind = typeof CompletionItemKind[keyof typeof CompletionItemKind];

export interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkupContent;
  insertText?: string;
  insertTextFormat?: InsertTextFormat;
  textEdit?: TextEdit;
  additionalTextEdits?: TextEdit[];
  sortText?: string;
  filterText?: string;
}

export interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}

export interface MarkupContent {
  kind: "plaintext" | "markdown";
  value: string;
}

// InsertTextFormat as const object instead of enum
export const InsertTextFormat = {
  PlainText: 1,
  Snippet: 2,
} as const;
export type InsertTextFormat = typeof InsertTextFormat[keyof typeof InsertTextFormat];

export interface TextEdit {
  range: Range;
  newText: string;
}

// Hover
export interface Hover {
  contents: string | MarkupContent | MarkupContent[];
  range?: Range;
}

// Server Capabilities
export interface ServerCapabilities {
  textDocumentSync?: number | TextDocumentSyncOptions;
  completionProvider?: CompletionOptions;
  hoverProvider?: boolean;
  definitionProvider?: boolean;
  referencesProvider?: boolean;
  documentSymbolProvider?: boolean;
  diagnosticProvider?: DiagnosticOptions;
}

export interface TextDocumentSyncOptions {
  openClose?: boolean;
  change?: number; // 0 = None, 1 = Full, 2 = Incremental
  save?: boolean | SaveOptions;
}

export interface SaveOptions {
  includeText?: boolean;
}

export interface CompletionOptions {
  triggerCharacters?: string[];
  resolveProvider?: boolean;
}

export interface DiagnosticOptions {
  interFileDependencies?: boolean;
  workspaceDiagnostics?: boolean;
}

// Initialize
export interface InitializeParams {
  processId: number | null;
  rootUri: string | null;
  capabilities: ClientCapabilities;
  workspaceFolders?: WorkspaceFolder[] | null;
}

export interface ClientCapabilities {
  textDocument?: TextDocumentClientCapabilities;
  workspace?: WorkspaceClientCapabilities;
}

export interface TextDocumentClientCapabilities {
  synchronization?: {
    didSave?: boolean;
  };
  completion?: {
    completionItem?: {
      snippetSupport?: boolean;
      documentationFormat?: string[];
    };
  };
  hover?: {
    contentFormat?: string[];
  };
  publishDiagnostics?: {
    relatedInformation?: boolean;
  };
}

export interface WorkspaceClientCapabilities {
  workspaceFolders?: boolean;
}

export interface WorkspaceFolder {
  uri: string;
  name: string;
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
}

// JSON-RPC
export interface JsonRpcMessage {
  jsonrpc: "2.0";
}

export interface JsonRpcRequest extends JsonRpcMessage {
  id: number | string;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse extends JsonRpcMessage {
  id: number | string | null;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcNotification extends JsonRpcMessage {
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// LSP Server Config
export interface LspServerConfig {
  language: string;
  command: string;
  args: string[];
  root_path?: string;
}

// LSP Language configs
export const LSP_CONFIGS: Record<string, Omit<LspServerConfig, "root_path">> = {
  python: {
    language: "python",
    command: "pylsp",
    args: [],
  },
  rust: {
    language: "rust",
    command: "rust-analyzer",
    args: [],
  },
  typescript: {
    language: "typescript",
    command: "typescript-language-server",
    args: ["--stdio"],
  },
  javascript: {
    language: "javascript",
    command: "typescript-language-server",
    args: ["--stdio"],
  },
};
