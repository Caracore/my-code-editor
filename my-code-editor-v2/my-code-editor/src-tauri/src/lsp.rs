// Minimal Language Server Protocol bridge.
//
// Each call to `start_lsp` spawns a child process (e.g. `pylsp`,
// `rust-analyzer`, `typescript-language-server --stdio`) and pipes
// JSON-RPC messages back to the front-end as Tauri events.
//
// Message framing follows the LSP base protocol:
//     Content-Length: <N>\r\n\r\n<json body of N bytes>
//
// The front-end is responsible for the initialize handshake, document
// lifecycle (didOpen/didChange/didClose), and request/response
// correlation; the Rust side only does transport.

use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

#[derive(Deserialize)]
pub struct LspServerConfig {
    #[allow(dead_code)]
    pub language: String,
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub root_path: Option<String>,
}

pub struct LspProcess {
    child: Child,
    stdin: ChildStdin,
}

#[derive(Default)]
pub struct LspState {
    pub servers: Mutex<HashMap<String, LspProcess>>,
    pub next_id: AtomicI64,
}

fn write_lsp_message<W: Write>(w: &mut W, msg: &Value) -> Result<(), String> {
    let s = serde_json::to_string(msg).map_err(|e| e.to_string())?;
    let header = format!("Content-Length: {}\r\n\r\n", s.len());
    w.write_all(header.as_bytes()).map_err(|e| e.to_string())?;
    w.write_all(s.as_bytes()).map_err(|e| e.to_string())?;
    w.flush().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn start_lsp(
    app: AppHandle,
    state: State<'_, LspState>,
    server_id: String,
    config: LspServerConfig,
) -> Result<(), String> {
    {
        let map = state.servers.lock().map_err(|e| e.to_string())?;
        if map.contains_key(&server_id) {
            return Ok(()); // idempotent
        }
    }

    let mut cmd = Command::new(&config.command);
    cmd.args(&config.args);
    if let Some(root) = config.root_path.as_deref().filter(|s| !s.is_empty()) {
        cmd.current_dir(root);
    }
    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Hide console window on Windows.
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn LSP server `{}`: {}", config.command, e))?;
    let stdin = child.stdin.take().ok_or("LSP child has no stdin")?;
    let stdout = child.stdout.take().ok_or("LSP child has no stdout")?;
    let stderr = child.stderr.take().ok_or("LSP child has no stderr")?;

    // stdout: parse LSP frames and forward each message as a Tauri event.
    let app_clone = app.clone();
    let sid = server_id.clone();
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        loop {
            // Headers
            let mut content_length: Option<usize> = None;
            loop {
                let mut line = String::new();
                match reader.read_line(&mut line) {
                    Ok(0) => return,
                    Ok(_) => {}
                    Err(_) => return,
                }
                let trimmed = line.trim_end_matches(|c: char| c == '\r' || c == '\n');
                if trimmed.is_empty() {
                    break;
                }
                if let Some(rest) = trimmed.strip_prefix("Content-Length:") {
                    if let Ok(n) = rest.trim().parse::<usize>() {
                        content_length = Some(n);
                    }
                }
            }
            let n = match content_length {
                Some(n) => n,
                None => continue,
            };
            // Body
            let mut buf = vec![0u8; n];
            if reader.read_exact(&mut buf).is_err() {
                return;
            }
            let msg: Value = match serde_json::from_slice(&buf) {
                Ok(v) => v,
                Err(e) => {
                    eprintln!("[lsp:{}] failed to parse message: {}", sid, e);
                    continue;
                }
            };
            let _ = app_clone.emit(
                "lsp-message",
                json!({
                    "server_id": sid,
                    "message": msg,
                }),
            );
        }
    });

    // stderr: log to console so users can diagnose missing servers.
    let sid_err = server_id.clone();
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => return,
                Ok(_) => {
                    eprintln!("[lsp:{}] {}", sid_err, line.trim_end());
                }
                Err(_) => return,
            }
        }
    });

    state
        .servers
        .lock()
        .map_err(|e| e.to_string())?
        .insert(server_id, LspProcess { child, stdin });
    Ok(())
}

#[tauri::command]
pub fn stop_lsp(state: State<'_, LspState>, server_id: String) -> Result<(), String> {
    let mut map = state.servers.lock().map_err(|e| e.to_string())?;
    if let Some(mut proc) = map.remove(&server_id) {
        // Best effort polite shutdown.
        let _ = write_lsp_message(
            &mut proc.stdin,
            &json!({"jsonrpc": "2.0", "id": -1, "method": "shutdown"}),
        );
        let _ = write_lsp_message(
            &mut proc.stdin,
            &json!({"jsonrpc": "2.0", "method": "exit"}),
        );
        let _ = proc.child.kill();
        let _ = proc.child.wait();
    }
    Ok(())
}

#[tauri::command]
pub fn send_lsp_request(
    state: State<'_, LspState>,
    server_id: String,
    method: String,
    params: Value,
) -> Result<i64, String> {
    let id = state.next_id.fetch_add(1, Ordering::SeqCst) + 1;
    let msg = json!({
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params,
    });
    let mut map = state.servers.lock().map_err(|e| e.to_string())?;
    let proc = map
        .get_mut(&server_id)
        .ok_or_else(|| format!("No LSP server with id {}", server_id))?;
    write_lsp_message(&mut proc.stdin, &msg)?;
    Ok(id)
}

#[tauri::command]
pub fn send_lsp_notification(
    state: State<'_, LspState>,
    server_id: String,
    method: String,
    params: Value,
) -> Result<(), String> {
    let msg = json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
    });
    let mut map = state.servers.lock().map_err(|e| e.to_string())?;
    let proc = map
        .get_mut(&server_id)
        .ok_or_else(|| format!("No LSP server with id {}", server_id))?;
    write_lsp_message(&mut proc.stdin, &msg)
}
