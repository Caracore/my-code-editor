//! Database commands.
//!
//! Phase 1: built-in SQLite via `rusqlite` (bundled, no system dep).
//! Other drivers (postgres, mysql, mssql, mongodb) are intentionally left
//! unimplemented — they are expected to be provided by future plugins.
//!
//! Connections are cached per `DbConnection.id` so subsequent queries reuse
//! the same handle. The frontend is responsible for assigning stable ids.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use rusqlite::types::ValueRef;
use rusqlite::{Connection, OpenFlags};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tauri::State;
use thiserror::Error;

/// Connection descriptor mirrored from the frontend.
///
/// For SQLite, `host` holds the file path (or `":memory:"`).
/// Other fields are kept for future driver implementations.
#[derive(Debug, Clone, Deserialize)]
pub struct DbConnection {
    pub id: String,
    #[allow(dead_code)]
    pub name: String,
    pub driver: String,
    pub host: String,
    #[allow(dead_code)]
    pub port: Option<u16>,
    #[allow(dead_code)]
    pub database: Option<String>,
    #[allow(dead_code)]
    pub user: Option<String>,
    #[allow(dead_code)]
    pub password: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Map<String, Value>>,
    #[serde(rename = "rowsAffected", skip_serializing_if = "Option::is_none")]
    pub rows_affected: Option<usize>,
    #[serde(rename = "durationMs")]
    pub duration_ms: u64,
}

#[derive(Debug, Error)]
pub enum DbError {
    #[error("driver `{0}` is not built in; install the corresponding plugin")]
    UnsupportedDriver(String),
    #[error("missing SQLite file path")]
    MissingPath,
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("connection lock poisoned")]
    Poisoned,
}

impl serde::Serialize for DbError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

/// Per-app state: cached connection handles keyed by `DbConnection.id`.
#[derive(Default)]
pub struct DbState {
    sqlite: Mutex<HashMap<String, Arc<Mutex<Connection>>>>,
}

impl DbState {
    fn sqlite_handle(&self, conn: &DbConnection) -> Result<Arc<Mutex<Connection>>, DbError> {
        let mut map = self.sqlite.lock().map_err(|_| DbError::Poisoned)?;
        if let Some(h) = map.get(&conn.id) {
            return Ok(h.clone());
        }
        if conn.host.trim().is_empty() {
            return Err(DbError::MissingPath);
        }
        let flags = OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_URI
            | OpenFlags::SQLITE_OPEN_NO_MUTEX;
        let c = Connection::open_with_flags(&conn.host, flags)?;
        let arc = Arc::new(Mutex::new(c));
        map.insert(conn.id.clone(), arc.clone());
        Ok(arc)
    }
}

/// Run a SQL statement against the given connection.
///
/// Heuristic: a SELECT-like statement (returning columns) yields rows; any
/// other statement is executed via `execute` and reports `rowsAffected`.
#[tauri::command]
pub async fn db_query(
    state: State<'_, DbState>,
    connection: DbConnection,
    sql: String,
) -> Result<QueryResult, DbError> {
    match connection.driver.as_str() {
        "sqlite" => run_sqlite(&state, &connection, &sql),
        other => Err(DbError::UnsupportedDriver(other.to_string())),
    }
}

/// Drop a cached connection (e.g. after the user edits its settings).
#[tauri::command]
pub async fn db_disconnect(state: State<'_, DbState>, id: String) -> Result<(), DbError> {
    if let Ok(mut map) = state.sqlite.lock() {
        map.remove(&id);
    }
    Ok(())
}

fn run_sqlite(
    state: &DbState,
    conn: &DbConnection,
    sql: &str,
) -> Result<QueryResult, DbError> {
    let handle = state.sqlite_handle(conn)?;
    let guard = handle.lock().map_err(|_| DbError::Poisoned)?;
    let started = Instant::now();

    // Split into individual statements so the user can run scripts like
    //   CREATE TABLE t(x); INSERT INTO t VALUES(1); SELECT * FROM t;
    // The last row-producing statement provides the returned rows; any
    // non-row-producing statements have their affected counts summed.
    let statements = split_sql_statements(sql);
    if statements.is_empty() {
        return Ok(QueryResult {
            columns: Vec::new(),
            rows: Vec::new(),
            rows_affected: None,
            duration_ms: elapsed_ms(started),
        });
    }

    let mut last_columns: Vec<String> = Vec::new();
    let mut last_rows: Vec<Map<String, Value>> = Vec::new();
    let mut produced_rows = false;
    let mut total_affected: usize = 0;
    let mut had_affected = false;

    for stmt_sql in &statements {
        let mut stmt = guard.prepare(stmt_sql)?;
        let column_count = stmt.column_count();

        if column_count == 0 {
            drop(stmt);
            let affected = guard.execute(stmt_sql, [])?;
            total_affected = total_affected.saturating_add(affected);
            had_affected = true;
            continue;
        }

        let columns: Vec<String> = (0..column_count)
            .map(|i| stmt.column_name(i).unwrap_or("?").to_string())
            .collect();

        let mut rows_iter = stmt.query([])?;
        let mut rows: Vec<Map<String, Value>> = Vec::new();
        while let Some(row) = rows_iter.next()? {
            let mut obj = Map::with_capacity(columns.len());
            for (i, col) in columns.iter().enumerate() {
                let v = match row.get_ref(i)? {
                    ValueRef::Null => Value::Null,
                    ValueRef::Integer(n) => Value::from(n),
                    ValueRef::Real(f) => serde_json::Number::from_f64(f)
                        .map(Value::Number)
                        .unwrap_or(Value::Null),
                    ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
                    ValueRef::Blob(b) => Value::String(format!("<blob {} bytes>", b.len())),
                };
                obj.insert(col.clone(), v);
            }
            rows.push(obj);
        }
        last_columns = columns;
        last_rows = rows;
        produced_rows = true;
    }

    Ok(QueryResult {
        columns: last_columns,
        rows: last_rows,
        // Only report affected rows if no SELECT-style statement ran last;
        // mixing both would be misleading in the UI.
        rows_affected: if had_affected && !produced_rows {
            Some(total_affected)
        } else if had_affected && produced_rows {
            Some(total_affected)
        } else {
            None
        },
        duration_ms: elapsed_ms(started),
    })
}

/// Split a SQL script into individual statements on `;`, while respecting
/// single/double-quoted strings, bracketed identifiers (`[...]`), backticks,
/// `--` line comments, and `/* ... */` block comments. Trims whitespace and
/// drops empty statements.
fn split_sql_statements(sql: &str) -> Vec<String> {
    let bytes = sql.as_bytes();
    let mut out: Vec<String> = Vec::new();
    let mut start: usize = 0;
    let mut i: usize = 0;

    #[derive(PartialEq)]
    enum Mode {
        Normal,
        LineComment,
        BlockComment,
        SingleQuote,
        DoubleQuote,
        Backtick,
        Bracket, // [identifier]
    }
    let mut mode = Mode::Normal;

    while i < bytes.len() {
        let c = bytes[i];
        let next = bytes.get(i + 1).copied();
        match mode {
            Mode::Normal => match c {
                b'\'' => mode = Mode::SingleQuote,
                b'"' => mode = Mode::DoubleQuote,
                b'`' => mode = Mode::Backtick,
                b'[' => mode = Mode::Bracket,
                b'-' if next == Some(b'-') => {
                    mode = Mode::LineComment;
                    i += 1;
                }
                b'/' if next == Some(b'*') => {
                    mode = Mode::BlockComment;
                    i += 1;
                }
                b';' => {
                    let piece = sql[start..i].trim();
                    if !piece.is_empty() {
                        out.push(piece.to_string());
                    }
                    start = i + 1;
                }
                _ => {}
            },
            Mode::LineComment => {
                if c == b'\n' {
                    mode = Mode::Normal;
                }
            }
            Mode::BlockComment => {
                if c == b'*' && next == Some(b'/') {
                    mode = Mode::Normal;
                    i += 1;
                }
            }
            Mode::SingleQuote => {
                if c == b'\'' {
                    // Doubled '' inside single-quoted string is an escape.
                    if next == Some(b'\'') {
                        i += 1;
                    } else {
                        mode = Mode::Normal;
                    }
                }
            }
            Mode::DoubleQuote => {
                if c == b'"' {
                    if next == Some(b'"') {
                        i += 1;
                    } else {
                        mode = Mode::Normal;
                    }
                }
            }
            Mode::Backtick => {
                if c == b'`' {
                    mode = Mode::Normal;
                }
            }
            Mode::Bracket => {
                if c == b']' {
                    mode = Mode::Normal;
                }
            }
        }
        i += 1;
    }

    let tail = sql[start..].trim();
    if !tail.is_empty() {
        out.push(tail.to_string());
    }
    out
}

fn elapsed_ms(start: Instant) -> u64 {
    start.elapsed().as_millis() as u64
}
