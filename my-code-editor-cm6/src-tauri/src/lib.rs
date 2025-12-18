// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//   tauri::Builder::default()
//     .setup(|app| {
//       if cfg!(debug_assertions) {
//         app.handle().plugin(
//           tauri_plugin_log::Builder::default()
//             .level(log::LevelFilter::Info)
//             .build(),
//         )?;
//       }
//       Ok(())
//     })
//     .run(tauri::generate_context!())
//     .expect("error while running tauri application");
// }
mod terminal;

use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use std::path::PathBuf;

#[derive(serde::Serialize)]
struct FileEntry {
    path: String,
    is_dir: bool,
}

// Obtenir le chemin du dossier de configuration dans %appdata%
fn get_config_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Impossible d'obtenir le chemin AppData: {}", e))?;
    
    let app_config_dir = app_data_dir.join("my-code-editor");
    
    // Créer le dossier s'il n'existe pas
    if !app_config_dir.exists() {
        std::fs::create_dir_all(&app_config_dir)
            .map_err(|e| format!("Erreur lors de la création du dossier de configuration: {}", e))?;
    }
    
    Ok(app_config_dir)
}

#[tauri::command]
async fn get_config_path(app_handle: AppHandle) -> Result<String, String> {
    let config_dir = get_config_dir(&app_handle)?;
    Ok(config_dir.to_string_lossy().to_string())
}

#[tauri::command]
async fn open_folder_dialog(app: tauri::AppHandle) -> Option<String> {
    let folder = app.dialog().file().blocking_pick_folder()?;

    match folder {
        tauri_plugin_dialog::FilePath::Path(path_buf) => {
            Some(path_buf.to_string_lossy().to_string())
        }
        tauri_plugin_dialog::FilePath::Url(url) => Some(url.to_string()),
    }
}

#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = vec![];

    for entry in std::fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;

        entries.push(FileEntry {
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
        });
    }

    Ok(entries)
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    std::fs::write(&path, "").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    std::fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn read_settings(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_settings(path: String, content: String) -> Result<(), String> {
    // Créer le répertoire parent si nécessaire
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
struct IsDirResult {
    is_dir: bool,
}

#[tauri::command]
fn check_is_dir(path: String) -> Result<IsDirResult, String> {
    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    Ok(IsDirResult {
        is_dir: metadata.is_dir(),
    })
}

#[tauri::command]
fn trash_file(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    
    if metadata.is_dir() {
        std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(&path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn start_terminal(
    id: String,
    app: AppHandle,
    state: tauri::State<terminal::TerminalState>,
) -> Result<String, String> {
    state.spawn(id, app)
}

#[tauri::command]
fn stop_terminal(id: String, state: tauri::State<terminal::TerminalState>) -> Result<(), String> {
    state.stop(id)
}

#[tauri::command]
fn write_to_terminal(
    id: String,
    data: String,
    state: tauri::State<terminal::TerminalState>,
) -> Result<(), String> {
    state.write(id, data)
}

#[tauri::command]
fn resize_terminal(
    id: String,
    cols: u16,
    rows: u16,
    state: tauri::State<terminal::TerminalState>,
) -> Result<(), String> {
    state.resize(id, cols, rows)
}

#[tauri::command]
fn list_terminals(state: tauri::State<terminal::TerminalState>) -> Result<Vec<String>, String> {
    Ok(state.list_terminals())
}

#[tauri::command]
fn stop_all_terminals(state: tauri::State<terminal::TerminalState>) -> Result<(), String> {
    state.stop_all()
}

#[tauri::command]
fn switch_shell(shell: String, state: tauri::State<terminal::TerminalState>) -> Result<(), String> {
    state.set_shell(shell)
}

#[tauri::command]
fn change_terminal_directory(
    id: String,
    path: String,
    state: tauri::State<terminal::TerminalState>,
) -> Result<(), String> {
    // Envoyer la commande cd au terminal
    let cmd = format!("cd /d \"{}\"\r\n", path);
    state.write(id, cmd)
}

pub fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(terminal::TerminalState::default())
        .invoke_handler(tauri::generate_handler![
            open_folder_dialog,
            list_directory,
            read_file,
            save_file,
            create_file,
            create_directory,
            rename_file,
            check_is_dir,
            trash_file,
            delete_file,
            read_settings,
            write_settings,
            get_config_path,
            start_terminal,
            stop_terminal,
            write_to_terminal,
            resize_terminal,
            list_terminals,
            stop_all_terminals,
            switch_shell,
            change_terminal_directory,
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
