import { CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult, Completion } from "@codemirror/autocomplete";
import { lspManager } from "../../lsp";
import type { CompletionItem } from "../../lsp/types";
import { CompletionItemKind, InsertTextFormat } from "../../lsp/types";

// Map LSP CompletionItemKind to CodeMirror types
function kindToType(kind?: CompletionItemKind): string {
  switch (kind) {
    case CompletionItemKind.Method:
    case CompletionItemKind.Function:
      return "function";
    case CompletionItemKind.Constructor:
      return "function";
    case CompletionItemKind.Field:
    case CompletionItemKind.Variable:
      return "variable";
    case CompletionItemKind.Class:
      return "class";
    case CompletionItemKind.Interface:
      return "interface";
    case CompletionItemKind.Module:
      return "namespace";
    case CompletionItemKind.Property:
      return "property";
    case CompletionItemKind.Unit:
    case CompletionItemKind.Value:
      return "constant";
    case CompletionItemKind.Enum:
    case CompletionItemKind.EnumMember:
      return "enum";
    case CompletionItemKind.Keyword:
      return "keyword";
    case CompletionItemKind.Snippet:
      return "snippet";
    case CompletionItemKind.Color:
      return "constant";
    case CompletionItemKind.File:
    case CompletionItemKind.Folder:
      return "constant";
    case CompletionItemKind.Constant:
      return "constant";
    case CompletionItemKind.Struct:
      return "class";
    case CompletionItemKind.Event:
      return "function";
    case CompletionItemKind.Operator:
      return "keyword";
    case CompletionItemKind.TypeParameter:
      return "type";
    default:
      return "text";
  }
}

// Convert LSP completion item to CodeMirror completion
function lspItemToCm(item: CompletionItem): Completion {
  let apply: string | undefined;
  
  if (item.textEdit) {
    apply = item.textEdit.newText;
  } else if (item.insertText) {
    apply = item.insertText;
  }
  
  // Handle snippets - convert LSP snippet syntax to plain text for now
  if (item.insertTextFormat === InsertTextFormat.Snippet && apply) {
    // Simple conversion: remove ${n:placeholder} -> placeholder, ${n} -> ""
    apply = apply
      .replace(/\$\{(\d+):([^}]+)\}/g, "$2")
      .replace(/\$\{\d+\}/g, "")
      .replace(/\$\d+/g, "");
  }
  
  let detail = item.detail;
  if (item.documentation) {
    if (typeof item.documentation === "string") {
      detail = detail ? `${detail}\n${item.documentation}` : item.documentation;
    } else {
      detail = detail ? `${detail}\n${item.documentation.value}` : item.documentation.value;
    }
  }
  
  return {
    label: item.label,
    type: kindToType(item.kind),
    detail: item.detail,
    info: detail,
    apply,
    boost: item.sortText ? -item.sortText.charCodeAt(0) : 0,
  };
}

// Create LSP completion provider for a specific language
export function createLspCompletionProvider(language: string, filePath: () => string | null) {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const path = filePath();
    if (!path) return null;

    const client = lspManager.getClient(language);
    if (!client?.isInitialized()) return null;

    // Get word before cursor
    const word = context.matchBefore(/[\w.]+/);
    const from = word?.from ?? context.pos;

    // Convert CM position to LSP position
    const line = context.state.doc.lineAt(context.pos);
    const lspPosition = {
      line: line.number - 1,
      character: context.pos - line.from,
    };

    try {
      const items = await client.getCompletions(path, lspPosition);
      
      if (!items || items.length === 0) return null;

      return {
        from,
        options: items.map(lspItemToCm),
        validFor: /^[\w.]*$/,
      };
    } catch (error) {
      console.error(`[LSP Completion] Error:`, error);
      return null;
    }
  };
}

// Generic LSP completion provider that uses the document's language
export function lspCompletionProvider(getFilePath: () => string | null, getLanguage: () => string | null) {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const path = getFilePath();
    const language = getLanguage();
    
    if (!path || !language) return null;

    const client = lspManager.getClient(language);
    if (!client?.isInitialized()) return null;

    const word = context.matchBefore(/[\w.]+/);
    const from = word?.from ?? context.pos;

    const line = context.state.doc.lineAt(context.pos);
    const lspPosition = {
      line: line.number - 1,
      character: context.pos - line.from,
    };

    try {
      const items = await client.getCompletions(path, lspPosition);
      
      if (!items || items.length === 0) return null;

      return {
        from,
        options: items.map(lspItemToCm),
        validFor: /^[\w.]*$/,
      };
    } catch (error) {
      console.error(`[LSP Completion] Error:`, error);
      return null;
    }
  };
}
