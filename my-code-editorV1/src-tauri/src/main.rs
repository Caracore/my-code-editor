// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use tauri::Manager;

// #[tauri::command]
// async fn open_file_dialog() -> Option<String> {
//     let path = tauri::api::dialog::blocking::FileDialogBuilder::new()
//         .set_title("Ouvrir un fichier")
//         .pick_file();

//     path.map(|p| p.to_string_lossy().to_string())
// }

// #[tauri::command]
// async fn read_file(path: String) -> Result<String, String> {
//     std::fs::read_to_string(&path).map_err(|e| e.to_string())
// }

// #[tauri::command]
// async fn save_file(path: String, content: String) -> Result<(), String> {
//     std::fs::write(&path, content).map_err(|e| e.to_string())
// }
fn main() {
    my_code_editor_lib::run()
}
