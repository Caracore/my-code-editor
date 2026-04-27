import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

export interface DirEntry {
  name: string;
  path: string;
  /** snake_case from Rust */
  is_dir: boolean;
}

/** List directory contents. Folders first, alphabetical. Noisy dirs skipped. */
export async function readDir(path: string): Promise<DirEntry[]> {
  return invoke<DirEntry[]>("read_dir", { path });
}

/** Read a UTF-8 text file. */
export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

/** Write a UTF-8 text file. */
export async function writeFile(path: string, contents: string): Promise<void> {
  return invoke<void>("write_file", { path, contents });
}

/** Move/rename a file or folder. Returns the new absolute path. */
export async function movePath(from: string, to: string): Promise<string> {
  return invoke<string>("move_path", { from, to });
}

/** Create a new empty file. Returns the absolute path. */
export async function createFile(path: string): Promise<string> {
  return invoke<string>("create_file", { path });
}

/** Create a new directory (single level). Returns the absolute path. */
export async function createDir(path: string): Promise<string> {
  return invoke<string>("create_dir", { path });
}

/** Delete a file or folder (recursive for folders). */
export async function deletePath(path: string): Promise<void> {
  return invoke<void>("delete_path", { path });
}

/** Return the parent folder of a path (handles both \ and /). */
export function dirname(path: string): string {
  const norm = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(0, idx) : "";
}

/** Join a folder and a name using the original path's separator style. */
export function joinPath(folder: string, name: string): string {
  const sep = folder.includes("\\") && !folder.includes("/") ? "\\" : "/";
  const trimmed = folder.replace(/[\\/]+$/, "");
  return `${trimmed}${sep}${name}`;
}

/** Show the OS folder picker. Returns null if cancelled. */
export async function pickFolder(): Promise<string | null> {
  const selected = await openDialog({ directory: true, multiple: false });
  if (!selected) return null;
  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected as string;
}

/** Show the OS file picker. */
export async function pickFile(): Promise<string | null> {
  const selected = await openDialog({ directory: false, multiple: false });
  if (!selected) return null;
  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected as string;
}

/** Get the basename (last segment) of a path. Handles both \ and /. */
export function basename(path: string): string {
  const norm = path.replace(/\\/g, "/").replace(/\/+$/, "");
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(idx + 1) : norm;
}

/** Lower-case extension without the dot. Empty if none. */
export function extOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

/** Map a file extension to a CodeMirror language id. */
export function extToLanguage(ext: string): string {
  switch (ext) {
    case "tsx": case "ts":  return "tsx";
    case "jsx": case "js":  return "jsx";
    case "css":             return "css";
    case "html": case "htm": return "html";
    case "json":            return "json";
    case "py":              return "python";
    case "rs":              return "rust";
    case "cpp": case "cc": case "cxx":
    case "c": case "h": case "hpp": case "hh":
      return "cpp";
    case "md":              return "markdown";
    case "toml":            return "toml";
    default:                return "plaintext";
  }
}

