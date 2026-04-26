use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, Serialize)]
struct LspMessage {
    server_id: String,
    message: Value,
}

#[derive(Clone, Serialize)]
struct LspError {
    server_id: String,
    error: String,
}

struct LspProcess {
    child: Child,
    #[allow(dead_code)]
    language: String,
}

pub struct LspState {
    processes: Mutex<HashMap<String, LspProcess>>,
    request_id: AtomicU64,
}

impl Default for LspState {
    fn default() -> Self {
        Self {
            processes: Mutex::new(HashMap::new()),
            request_id: AtomicU64::new(1),
        }
    }
}

impl LspState {
    fn next_request_id(&self) -> u64 {
        self.request_id.fetch_add(1, Ordering::SeqCst)
    }
}

#[derive(Deserialize)]
pub struct LspServerConfig {
    pub language: String,
    pub command: String,
    pub args: Vec<String>,
    pub root_path: Option<String>,
}

fn encode_lsp_message(content: &str) -> String {
    format!("Content-Length: {}\r\n\r\n{}", content.len(), content)
}

fn read_lsp_messages(server_id: String, mut reader: BufReader<std::process::ChildStdout>, app: AppHandle) {
    let mut headers = String::new();
    
    loop {
        headers.clear();
        
        // Read headers until empty line
        loop {
            let mut line = String::new();
            match reader.read_line(&mut line) {
                Ok(0) => return, // EOF
                Ok(_) => {
                    if line == "\r\n" || line == "\n" {
                        break;
                    }
                    headers.push_str(&line);
                }
                Err(_) => return,
            }
        }
        
        // Parse Content-Length
        let content_length: usize = headers
            .lines()
            .find(|l| l.to_lowercase().starts_with("content-length:"))
            .and_then(|l| l.split(':').nth(1))
            .and_then(|s| s.trim().parse().ok())
            .unwrap_or(0);
        
        if content_length == 0 {
            continue;
        }
        
        // Read content
        let mut content = vec![0u8; content_length];
        if std::io::Read::read_exact(&mut reader, &mut content).is_err() {
            continue;
        }
        
        // Parse JSON and emit to frontend
        if let Ok(content_str) = String::from_utf8(content) {
            if let Ok(json_msg) = serde_json::from_str::<Value>(&content_str) {
                let _ = app.emit("lsp-message", LspMessage {
                    server_id: server_id.clone(),
                    message: json_msg,
                });
            }
        }
    }
}

#[tauri::command]
pub fn start_lsp(
    server_id: String,
    config: LspServerConfig,
    app: AppHandle,
    state: tauri::State<Arc<LspState>>,
) -> Result<(), String> {
    let mut processes = state.processes.lock();
    
    if processes.contains_key(&server_id) {
        return Err(format!("LSP server '{}' already running", server_id));
    }
    
    // Spawn the LSP server process
    let mut cmd = Command::new(&config.command);
    cmd.args(&config.args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    
    if let Some(root) = &config.root_path {
        cmd.current_dir(root);
    }
    
    // Hide console window on Windows
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let mut child = cmd.spawn().map_err(|e| {
        format!("Failed to start LSP server '{}': {}", config.command, e)
    })?;
    
    // Take stdout for reading
    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let reader = BufReader::new(stdout);
    
    // Spawn reader thread
    let sid = server_id.clone();
    thread::spawn(move || {
        read_lsp_messages(sid, reader, app);
    });
    
    processes.insert(server_id.clone(), LspProcess {
        child,
        language: config.language,
    });
    
    Ok(())
}

#[tauri::command]
pub fn stop_lsp(
    server_id: String,
    state: tauri::State<Arc<LspState>>,
) -> Result<(), String> {
    let mut processes = state.processes.lock();
    
    if let Some(mut process) = processes.remove(&server_id) {
        let _ = process.child.kill();
        let _ = process.child.wait();
        Ok(())
    } else {
        Err(format!("LSP server '{}' not found", server_id))
    }
}

#[tauri::command]
pub fn send_lsp_request(
    server_id: String,
    method: String,
    params: Value,
    state: tauri::State<Arc<LspState>>,
) -> Result<u64, String> {
    let mut processes = state.processes.lock();
    
    let process = processes.get_mut(&server_id)
        .ok_or_else(|| format!("LSP server '{}' not found", server_id))?;
    
    let id = state.next_request_id();
    
    let request = json!({
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params
    });
    
    let content = serde_json::to_string(&request).map_err(|e| e.to_string())?;
    let message = encode_lsp_message(&content);
    
    let stdin = process.child.stdin.as_mut().ok_or("No stdin available")?;
    stdin.write_all(message.as_bytes()).map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub fn send_lsp_notification(
    server_id: String,
    method: String,
    params: Value,
    state: tauri::State<Arc<LspState>>,
) -> Result<(), String> {
    let mut processes = state.processes.lock();
    
    let process = processes.get_mut(&server_id)
        .ok_or_else(|| format!("LSP server '{}' not found", server_id))?;
    
    let notification = json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params
    });
    
    let content = serde_json::to_string(&notification).map_err(|e| e.to_string())?;
    let message = encode_lsp_message(&content);
    
    let stdin = process.child.stdin.as_mut().ok_or("No stdin available")?;
    stdin.write_all(message.as_bytes()).map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn list_lsp_servers(
    state: tauri::State<Arc<LspState>>,
) -> Vec<String> {
    state.processes.lock().keys().cloned().collect()
}

#[tauri::command]
pub fn stop_all_lsp(
    state: tauri::State<Arc<LspState>>,
) -> Result<(), String> {
    let mut processes = state.processes.lock();
    
    for (_, mut process) in processes.drain() {
        let _ = process.child.kill();
        let _ = process.child.wait();
    }
    
    Ok(())
}
