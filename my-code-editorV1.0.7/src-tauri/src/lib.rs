mod terminal;

use tauri::AppHandle;

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
    println!("WRITE TO TERMINAL {}: {:?}", id, data);
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

pub fn main() {
    tauri::Builder::default()
        .manage(terminal::TerminalState::default())
        .invoke_handler(tauri::generate_handler![
            start_terminal,
            stop_terminal,
            write_to_terminal,
            resize_terminal,
            list_terminals,
            stop_all_terminals,
            switch_shell,
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
