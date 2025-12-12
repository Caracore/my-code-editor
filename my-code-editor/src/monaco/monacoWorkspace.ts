import * as monaco from "monaco-editor";
import { FileNode } from "../types/FileNode";
import { invoke } from "@tauri-apps/api/core";

export async function registerWorkspace(tree: FileNode[]) {
  for (const node of tree) {
    if (node.isDir && node.children) {
      await registerWorkspace(node.children);
    } else if (!node.isDir) {
      const content = await invoke<string>("read_file", { path: node.path });
      const uri = monaco.Uri.file(node.path);

      if (!monaco.editor.getModel(uri)) {
        monaco.editor.createModel(content, undefined, uri);
      }
    }
  }
}
