use serde::Serialize;
use std::fs;
use std::path::PathBuf;

mod terminal;
use terminal::{
    terminal_close, terminal_open, terminal_resize, terminal_write, TerminalState,
};

mod extensions;
use extensions::{extensions_dir, list_extensions, read_extension};

#[derive(Serialize)]
struct DirEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn read_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for entry in entries.flatten() {
        let p: PathBuf = entry.path();
        let is_dir = p.is_dir();
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip noisy directories
        if is_dir
            && (name == "node_modules"
                || name == ".git"
                || name == "target"
                || name == "dist"
                || name == ".idea"
                || name == ".vscode")
        {
            continue;
        }
        out.push(DirEntry {
            name,
            path: p.to_string_lossy().to_string(),
            is_dir,
        });
    }
    // Folders first, then alphabetical
    out.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(out)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

/// Move (rename) a file or folder. Refuses to overwrite an existing destination.
#[tauri::command]
fn move_path(from: String, to: String) -> Result<String, String> {
    let from_pb = PathBuf::from(&from);
    let to_pb = PathBuf::from(&to);
    if !from_pb.exists() {
        return Err(format!("source does not exist: {from}"));
    }
    if to_pb.exists() {
        return Err(format!("destination already exists: {to}"));
    }
    if let Some(parent) = to_pb.parent() {
        if !parent.exists() {
            return Err(format!("destination folder does not exist: {}", parent.display()));
        }
    }
    fs::rename(&from_pb, &to_pb).map_err(|e| e.to_string())?;
    Ok(to_pb.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(TerminalState::default())
        .invoke_handler(tauri::generate_handler![
            read_dir,
            read_file,
            write_file,
            move_path,
            extensions_dir,
            list_extensions,
            read_extension,
            terminal_open,
            terminal_write,
            terminal_resize,
            terminal_close,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
