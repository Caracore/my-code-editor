use std::fs;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_shell::ShellExt;

#[derive(serde::Serialize)]
struct FileEntry {
    path: String,
    is_dir: bool,
}

// #[tauri::command]
// fn create_folder(path: String) -> Result<(), String> {
//     fs::create_dir_all(&path).map_err(|e| e.to_string())?;
//     Ok(())
// }

#[tauri::command]
async fn run_command(
    app: tauri::AppHandle,
    command: String,
    cwd: Option<String>,
    shell: String,
) -> Result<String, String> {
    let mut cmd = match shell.as_str() {
        "bash" => {
            // ✅ Chemin Git Bash
            let git_bash = r"C:\Program Files\Git\bin\bash.exe";

            app.shell().command(git_bash).args(["-c", &command])
        }

        // ✅ CMD par défaut
        _ => app.shell().command("cmd").args(["/C", &command]),
    };

    if let Some(dir) = cwd {
        cmd = cmd.current_dir(dir);
    }

    let output = cmd.output().await.map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Option<String> {
    let file = app.dialog().file().blocking_pick_file()?;

    match file {
        tauri_plugin_dialog::FilePath::Path(path_buf) => {
            Some(path_buf.to_string_lossy().to_string())
        }
        tauri_plugin_dialog::FilePath::Url(url) => Some(url.to_string()),
    }
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
fn create_file(path: String) -> Result<(), String> {
    std::fs::write(&path, "").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    std::fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn trash_file(path: String) -> Result<(), String> {
    trash::delete(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            read_file,
            save_file,
            open_folder_dialog,
            list_directory,
            run_command,
            create_file,
            rename_file,
            trash_file,
            delete_file,
            create_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
