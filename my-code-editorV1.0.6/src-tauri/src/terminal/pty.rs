use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::Mutex,
    thread,
};

use portable_pty::{Child, CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Debug, Clone)]
struct TerminalOutput {
    id: String,
    data: String,
}

struct ActiveTerminal {
    id: String,
    child: Box<dyn Child + Send>,
    master: Box<dyn MasterPty + Send>,
    writer: Mutex<Box<dyn Write + Send>>,
}

pub struct TerminalState {
    shell: Mutex<String>,
    size: Mutex<PtySize>,
    terminals: Mutex<HashMap<String, ActiveTerminal>>,
}

impl Default for TerminalState {
    fn default() -> Self {
        Self {
            shell: Mutex::new(default_shell()),
            size: Mutex::new(PtySize {
                rows: 30,
                cols: 120,
                pixel_width: 0,
                pixel_height: 0,
            }),
            terminals: Mutex::new(HashMap::new()),
        }
    }
}

impl TerminalState {
    pub fn set_shell(&self, shell: String) -> Result<(), String> {
        let mut current = self.shell.lock().unwrap();
        *current = shell;
        Ok(())
    }

    pub fn spawn(&self, id: String, app: AppHandle) -> Result<String, String> {
        let mut terminals = self.terminals.lock().unwrap();

        if terminals.contains_key(&id) {
            return Err(format!("terminal with id '{}' already exists", id));
        }

        let size = *self.size.lock().unwrap();

        let pty_system = NativePtySystem::default();
        let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;

        let mut cmd = CommandBuilder::new("powershell.exe");
        cmd.arg("-NoLogo");
        cmd.arg("-NoExit");
        cmd.env("TERM", "xterm-256color");

        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        let master = pair.master;

        let writer = master
            .take_writer()
            .map_err(|e| format!("failed to take writer: {e}"))?;

        let reader = master.try_clone_reader().map_err(|e| e.to_string())?;
        
        let active = ActiveTerminal {
            id: id.clone(),
            child,
            master,
            writer: Mutex::new(writer),
        };

        let app_clone = app.clone();
        let terminal_id = id.clone();

        thread::spawn(move || {
            let mut reader = reader;
            let mut buf = [0u8; 4096];

            loop {
                match reader.read(&mut buf) {
                    Ok(0) => {
                        let _ = app_clone.emit(
                            "terminal-output",
                            TerminalOutput {
                                id: terminal_id.clone(),
                                data: "\n[process exited]\n".into(),
                            },
                        );
                        break;
                    }
                    Ok(n) => {
                        let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = app_clone.emit(
                            "terminal-output",
                            TerminalOutput {
                                id: terminal_id.clone(),
                                data: chunk,
                            },
                        );
                    }
                    Err(err) => {
                        let _ = app_clone.emit(
                            "terminal-output",
                            TerminalOutput {
                                id: terminal_id.clone(),
                                data: format!("\n[terminal error: {err}]\n"),
                            },
                        );
                        break;
                    }
                }
            }
        });

        terminals.insert(id.clone(), active);
        Ok(id)
    }

    pub fn stop(&self, id: String) -> Result<(), String> {
        let mut terminals = self.terminals.lock().unwrap();
        
        if let Some(mut active) = terminals.remove(&id) {
            active.child.kill().map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err(format!("terminal '{}' not found", id))
        }
    }

    pub fn write(&self, id: String, data: String) -> Result<(), String> {
        let terminals = self.terminals.lock().unwrap();
        let active = terminals
            .get(&id)
            .ok_or(format!("terminal '{}' not found", id))?;

        let mut writer = active.writer.lock().unwrap();
        writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn resize(&self, id: String, cols: u16, rows: u16) -> Result<(), String> {
        let mut terminals = self.terminals.lock().unwrap();
        
        if let Some(active) = terminals.get_mut(&id) {
            let size = PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            };
            active.master.resize(size).map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err(format!("terminal '{}' not found", id))
        }
    }

    pub fn list_terminals(&self) -> Vec<String> {
        let terminals = self.terminals.lock().unwrap();
        terminals.keys().cloned().collect()
    }

    pub fn stop_all(&self) -> Result<(), String> {
        let mut terminals = self.terminals.lock().unwrap();
        
        for (_, mut active) in terminals.drain() {
            let _ = active.child.kill();
        }
        
        Ok(())
    }
}

fn default_shell() -> String {
    #[cfg(windows)]
    {
        std::env::var("COMSPEC").unwrap_or("C:\\Windows\\System32\\cmd.exe".into())
    }

    #[cfg(unix)]
    {
        std::env::var("SHELL").unwrap_or("/bin/bash".into())
    }
}
