//! Workspace-wide search commands.
//!
//! Two flavours are exposed to the frontend:
//!   * `search_files`     — JetBrains-style "Search Everywhere" by file name
//!     (recursive walk, simple case-insensitive substring match).
//!   * `search_in_files`  — `grep -r`-style content search, returns one entry
//!     per matching line with a short preview.
//!
//! Both walks skip the same noisy directories `read_dir` already filters
//! (`node_modules`, `.git`, `target`, `dist`, …) plus a hard cap on the
//! number of results / files visited so a typo doesn't lock the IDE up.
//!
//! Like the Discord IPC bridge, the heavy work runs on `spawn_blocking`
//! so the Tokio runtime stays free for other invokes (read_dir,
//! pickFolder, …).
use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

const NOISY_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "target",
    "dist",
    "build",
    "out",
    ".idea",
    ".vscode",
    ".next",
    ".cache",
];

/// Hard cap on how many filesystem entries we will inspect for a single
/// query, regardless of the result limit. Prevents a runaway walk when the
/// workspace contains a huge tree the user forgot to ignore.
const MAX_ENTRIES_VISITED: usize = 200_000;

/// Skip individual files larger than this when grepping. Most source files
/// are well below this size; refusing to slurp larger files keeps memory
/// usage predictable.
const MAX_FILE_BYTES_FOR_GREP: u64 = 2 * 1024 * 1024;

#[derive(Serialize)]
pub struct FileSearchHit {
    /// Absolute path on disk.
    pub path: String,
    /// File / folder name (last segment of `path`).
    pub name: String,
    /// `true` when the entry is a directory.
    pub is_dir: bool,
}

#[derive(Serialize)]
pub struct GrepHit {
    pub path: String,
    pub name: String,
    /// 1-based line number.
    pub line: u32,
    /// 1-based column where the match starts.
    pub column: u32,
    /// Full text of the matching line (trimmed of trailing newline).
    pub preview: String,
}

fn is_noisy(name: &str) -> bool {
    NOISY_DIRS.iter().any(|d| *d == name)
}

/// Recursively collect entries under `root`, calling `visit` with each
/// (name, full path, is_dir). The walk stops as soon as `visit` returns
/// `false` or `MAX_ENTRIES_VISITED` is reached.
fn walk<F: FnMut(&str, &Path, bool) -> bool>(root: &Path, mut visit: F) {
    let mut stack: Vec<PathBuf> = vec![root.to_path_buf()];
    let mut visited = 0usize;
    while let Some(dir) = stack.pop() {
        let entries = match fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            visited += 1;
            if visited > MAX_ENTRIES_VISITED {
                return;
            }
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().into_owned();
            let is_dir = path.is_dir();
            if is_dir && is_noisy(&name) {
                continue;
            }
            if !visit(&name, &path, is_dir) {
                return;
            }
            if is_dir {
                stack.push(path);
            }
        }
    }
}

/// Search files and folders by name. Case-insensitive substring match.
#[tauri::command]
pub async fn search_files(
    root: String,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<FileSearchHit>, String> {
    let limit = limit.unwrap_or(200).min(2_000);
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }

    tauri::async_runtime::spawn_blocking(move || {
        let root_path = PathBuf::from(&root);
        if !root_path.is_dir() {
            return Err(format!("root is not a directory: {root}"));
        }
        let mut hits: Vec<FileSearchHit> = Vec::new();
        walk(&root_path, |name, path, is_dir| {
            if name.to_lowercase().contains(&q) {
                hits.push(FileSearchHit {
                    name: name.to_string(),
                    path: path.to_string_lossy().into_owned(),
                    is_dir,
                });
                if hits.len() >= limit {
                    return false;
                }
            }
            true
        });
        Ok(hits)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Recursive content search ("grep -r"). One hit per matching line.
///
/// `case_sensitive` defaults to false. `max_results` caps the total number
/// of returned hits across all files (default 500).
#[tauri::command]
pub async fn search_in_files(
    root: String,
    query: String,
    case_sensitive: Option<bool>,
    max_results: Option<usize>,
) -> Result<Vec<GrepHit>, String> {
    let case_sensitive = case_sensitive.unwrap_or(false);
    let max_results = max_results.unwrap_or(500).min(5_000);
    let raw_query = query;
    if raw_query.trim().is_empty() {
        return Ok(Vec::new());
    }

    tauri::async_runtime::spawn_blocking(move || {
        let root_path = PathBuf::from(&root);
        if !root_path.is_dir() {
            return Err(format!("root is not a directory: {root}"));
        }
        let needle = if case_sensitive {
            raw_query.clone()
        } else {
            raw_query.to_lowercase()
        };

        let mut hits: Vec<GrepHit> = Vec::new();
        walk(&root_path, |_name, path, is_dir| {
            if is_dir {
                return true;
            }
            // Skip files that are too big to safely slurp.
            let metadata = match fs::metadata(path) {
                Ok(m) => m,
                Err(_) => return true,
            };
            if metadata.len() > MAX_FILE_BYTES_FOR_GREP {
                return true;
            }
            // Skip likely-binary files: try reading as UTF-8 and let it
            // fail; the fallback `read` keeps us from panicking.
            let contents = match fs::read_to_string(path) {
                Ok(s) => s,
                Err(_) => return true,
            };

            for (idx, line) in contents.lines().enumerate() {
                let haystack: &str = if case_sensitive {
                    line
                } else {
                    // Allocating per line is wasteful, but keeps the code
                    // simple and the workload is already I/O-bound.
                    &line.to_lowercase()
                };
                let needle_ref: &str = &needle;
                if let Some(col_byte) = haystack.find(needle_ref) {
                    // Convert byte offset to char column (1-based).
                    let col = haystack[..col_byte].chars().count() as u32 + 1;
                    let name = path
                        .file_name()
                        .map(|n| n.to_string_lossy().into_owned())
                        .unwrap_or_default();
                    let preview = line
                        .trim_end_matches(['\r', '\n'])
                        .chars()
                        .take(400)
                        .collect();
                    hits.push(GrepHit {
                        path: path.to_string_lossy().into_owned(),
                        name,
                        line: idx as u32 + 1,
                        column: col,
                        preview,
                    });
                    if hits.len() >= max_results {
                        return false;
                    }
                }
            }
            true
        });
        Ok(hits)
    })
    .await
    .map_err(|e| e.to_string())?
}
