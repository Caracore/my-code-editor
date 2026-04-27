use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct ExtensionFile {
    pub name: String,
    pub path: String,
}

fn home() -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("USERPROFILE") {
        return Ok(PathBuf::from(p));
    }
    if let Ok(p) = std::env::var("HOME") {
        return Ok(PathBuf::from(p));
    }
    Err("cannot resolve home directory".into())
}

fn ext_root(kind: &str) -> Result<PathBuf, String> {
    let kind = match kind {
        "themes" | "plugins" => kind,
        _ => return Err(format!("invalid extension kind: {kind}")),
    };
    let mut p = home()?;
    p.push(".my-code-editor");
    p.push(kind);
    Ok(p)
}

#[tauri::command]
pub fn extensions_dir(kind: String) -> Result<String, String> {
    let p = ext_root(&kind)?;
    if !p.exists() {
        fs::create_dir_all(&p).map_err(|e| e.to_string())?;
    }
    Ok(p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_extensions(kind: String) -> Result<Vec<ExtensionFile>, String> {
    let dir = ext_root(&kind)?;
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let allowed_ext: &[&str] = match kind.as_str() {
        "themes" => &["json"],
        "plugins" => &["js", "mjs"],
        _ => &[],
    };
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for entry in entries.flatten() {
        let p = entry.path();
        if !p.is_file() {
            continue;
        }
        let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("");
        if !allowed_ext.iter().any(|e| e.eq_ignore_ascii_case(ext)) {
            continue;
        }
        let name = p
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        out.push(ExtensionFile {
            name,
            path: p.to_string_lossy().to_string(),
        });
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(out)
}

#[tauri::command]
pub fn read_extension(kind: String, name: String) -> Result<String, String> {
    // basic sandbox: prevent path traversal
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err("invalid extension name".into());
    }
    let mut p = ext_root(&kind)?;
    p.push(&name);
    fs::read_to_string(&p).map_err(|e| e.to_string())
}

/// Copy a user-picked file from anywhere on disk into the extensions
/// folder for the given kind. Returns the destination filename.
///
/// - Themes accept `*.json` only.
/// - Plugins accept `*.js` / `*.mjs` only.
///
/// If a file with the same name already exists, the new file is renamed
/// to `<stem>-<n>.<ext>` so existing extensions are never overwritten.
#[tauri::command]
pub fn import_extension(kind: String, src_path: String) -> Result<ExtensionFile, String> {
    let allowed: &[&str] = match kind.as_str() {
        "themes" => &["json"],
        "plugins" => &["js", "mjs"],
        _ => return Err(format!("invalid extension kind: {kind}")),
    };
    let src = PathBuf::from(&src_path);
    if !src.is_file() {
        return Err(format!("source is not a file: {src_path}"));
    }
    let ext = src
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !allowed.iter().any(|e| *e == ext.as_str()) {
        return Err(format!(
            "unsupported extension '.{ext}' for {kind} (allowed: {:?})",
            allowed
        ));
    }
    let dst_root = ext_root(&kind)?;
    if !dst_root.exists() {
        fs::create_dir_all(&dst_root).map_err(|e| e.to_string())?;
    }
    let original_name = src
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| "invalid source filename".to_string())?
        .to_string();

    // Disambiguate to avoid overwriting an existing extension.
    let stem = src
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("extension")
        .to_string();
    let mut candidate = original_name.clone();
    let mut dst = dst_root.join(&candidate);
    let mut n = 1u32;
    while dst.exists() {
        candidate = format!("{stem}-{n}.{ext}");
        dst = dst_root.join(&candidate);
        n += 1;
        if n > 999 {
            return Err("too many duplicates".into());
        }
    }
    fs::copy(&src, &dst).map_err(|e| e.to_string())?;
    Ok(ExtensionFile {
        name: candidate,
        path: dst.to_string_lossy().to_string(),
    })
}
