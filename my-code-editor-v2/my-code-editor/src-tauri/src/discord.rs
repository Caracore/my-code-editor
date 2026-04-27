//! Discord Rich Presence integration.
//!
//! Exposes three Tauri commands the frontend plugin can drive:
//!   * `discord_connect(app_id)`  — establish the IPC handshake.
//!   * `discord_update(payload)`  — refresh the activity card.
//!   * `discord_disconnect()`     — tear the connection down.
//!
//! IMPORTANT: every IPC call blocks on a Windows named pipe (or a Unix
//! socket on macOS/Linux). If we ran them directly inside a sync
//! `#[tauri::command]`, they would hold a Tokio worker thread hostage and
//! every other invoke (open folder, read_dir, …) would back up behind it,
//! freezing the entire UI. We therefore make the commands `async` and
//! offload the blocking work to `spawn_blocking`, which runs them on a
//! dedicated thread pool reserved for blocking I/O.
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use discord_rich_presence::{
    activity::{Activity, Assets, Timestamps},
    DiscordIpc, DiscordIpcClient,
};
use serde::Deserialize;
use tauri::State;

#[derive(Default, Clone)]
pub struct DiscordState {
    /// Active client + the start timestamp used for the "elapsed" counter.
    /// `Arc<Mutex<…>>` lets us clone a handle into `spawn_blocking`.
    inner: Arc<Mutex<Option<DiscordSlot>>>,
}

struct DiscordSlot {
    client: DiscordIpcClient,
    started_at: i64,
}

#[derive(Deserialize, Default)]
pub struct DiscordUpdatePayload {
    /// Filename currently in focus (e.g. "main.rs").
    #[serde(default)]
    pub file: Option<String>,
    /// Human-readable language label (e.g. "Rust").
    #[serde(default)]
    pub language: Option<String>,
    /// Project / workspace name.
    #[serde(default)]
    pub project: Option<String>,
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Run a closure on the blocking thread pool and propagate its result.
async fn blocking<F, T>(f: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn discord_connect(
    state: State<'_, DiscordState>,
    app_id: String,
) -> Result<(), String> {
    let inner = state.inner.clone();
    blocking(move || {
        let mut guard = inner.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            // Already connected — nothing to do.
            return Ok(());
        }
        let mut client = DiscordIpcClient::new(&app_id).map_err(|e| e.to_string())?;
        client.connect().map_err(|e| e.to_string())?;
        *guard = Some(DiscordSlot {
            client,
            started_at: now_secs(),
        });
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn discord_update(
    state: State<'_, DiscordState>,
    payload: DiscordUpdatePayload,
) -> Result<(), String> {
    let inner = state.inner.clone();
    let file = payload.file.unwrap_or_else(|| "Idle".to_string());
    let language = payload.language.unwrap_or_else(|| "Code".to_string());
    let project = payload
        .project
        .unwrap_or_else(|| "my-code-editor".to_string());

    blocking(move || {
        let mut guard = inner.lock().map_err(|e| e.to_string())?;
        let slot = guard
            .as_mut()
            .ok_or_else(|| "Discord client is not connected".to_string())?;

        let details = format!("Editing {file}");
        let state_str = format!("{language} • {project}");
        let timestamps = Timestamps::new().start(slot.started_at);
        let assets = Assets::new()
            .large_image("logo")
            .large_text("my-code-editor");

        let activity = Activity::new()
            .details(&details)
            .state(&state_str)
            .assets(assets)
            .timestamps(timestamps);

        slot.client
            .set_activity(activity)
            .map_err(|e| e.to_string())?;
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn discord_disconnect(state: State<'_, DiscordState>) -> Result<(), String> {
    let inner = state.inner.clone();
    blocking(move || {
        let mut guard = inner.lock().map_err(|e| e.to_string())?;
        if let Some(mut slot) = guard.take() {
            // Best-effort: clear the activity card before closing the socket
            // so the user's profile doesn't keep the stale "Editing …" line.
            let _ = slot.client.clear_activity();
            let _ = slot.client.close();
        }
        Ok(())
    })
    .await
}
