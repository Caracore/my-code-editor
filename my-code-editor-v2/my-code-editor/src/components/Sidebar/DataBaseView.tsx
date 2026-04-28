import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I } from "../Icons";
import "./DataBaseView.css";

/* ----------------------------------------------------------------- */
/*  Database connections sidebar view                                */
/*                                                                   */
/*  - Persists user-defined connections in localStorage.             */
/*  - Lets the user add / edit / remove / select a connection.       */
/*  - Provides a SQL scratchpad. Query execution is delegated to     */
/*    a Tauri backend command if available; otherwise the UI shows a */
/*    clear "backend not available" message instead of crashing.     */
/* ----------------------------------------------------------------- */

type DbDriver = "sqlite" | "postgres" | "mysql" | "mssql" | "mongodb";

interface DbConnection {
  id: string;
  name: string;
  driver: DbDriver;
  /** SQLite: file path. Others: host. */
  host: string;
  port?: number;
  database?: string;
  user?: string;
  /** Stored in plain localStorage. Avoid real production secrets here. */
  password?: string;
}

interface QueryResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowsAffected?: number;
  durationMs?: number;
}

const STORAGE_KEY = "my-code-editor:db-connections:v1";

const DRIVERS: Array<{ id: DbDriver; label: string; defaultPort?: number }> = [
  { id: "sqlite", label: "SQLite" },
  { id: "postgres", label: "PostgreSQL", defaultPort: 5432 },
  { id: "mysql", label: "MySQL / MariaDB", defaultPort: 3306 },
  { id: "mssql", label: "SQL Server", defaultPort: 1433 },
  { id: "mongodb", label: "MongoDB", defaultPort: 27017 },
];

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadConnections(): DbConnection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is DbConnection =>
        c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        typeof c.driver === "string" &&
        typeof c.host === "string",
    );
  } catch {
    return [];
  }
}

function saveConnections(items: DbConnection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore (quota / disabled storage)
  }
}

/** Best-effort lookup of the Tauri `invoke` helper without hard-failing. */
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const mod: { invoke?: (c: string, a?: Record<string, unknown>) => Promise<T> } =
    await import(/* @vite-ignore */ "@tauri-apps/api/core").catch(() => ({}));
  if (!mod.invoke) {
    throw new Error("Tauri runtime not available");
  }
  return mod.invoke(cmd, args);
}

/* ----------------------------------------------------------------- */

export default function DataBaseView() {
  const [connections, setConnections] = useState<DbConnection[]>(() => loadConnections());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DbConnection | null>(null);
  const [showForm, setShowForm] = useState(false);

  // SQL scratchpad
  const [sql, setSql] = useState<string>("SELECT 1;");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sqlRef = useRef<HTMLTextAreaElement | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    saveConnections(connections);
  }, [connections]);

  const selected = useMemo(
    () => connections.find((c) => c.id === selectedId) ?? null,
    [connections, selectedId],
  );

  const startNew = useCallback(() => {
    setEditing({
      id: newId(),
      name: "New connection",
      driver: "sqlite",
      host: "",
      port: undefined,
      database: "",
      user: "",
      password: "",
    });
    setShowForm(true);
  }, []);

  const startEdit = useCallback((c: DbConnection) => {
    setEditing({ ...c });
    setShowForm(true);
  }, []);

  const cancelForm = useCallback(() => {
    setEditing(null);
    setShowForm(false);
  }, []);

  const saveForm = useCallback(() => {
    if (!editing) return;
    const trimmed: DbConnection = {
      ...editing,
      name: editing.name.trim() || "Untitled",
      host: editing.host.trim(),
    };
    setConnections((prev) => {
      const idx = prev.findIndex((c) => c.id === trimmed.id);
      if (idx === -1) return [...prev, trimmed];
      const next = prev.slice();
      next[idx] = trimmed;
      return next;
    });
    setSelectedId(trimmed.id);
    setEditing(null);
    setShowForm(false);
  }, [editing]);

  const removeConnection = useCallback(
    (id: string) => {
      const c = connections.find((x) => x.id === id);
      if (!c) return;
      const ok = window.confirm(`Delete connection “${c.name}”?`);
      if (!ok) return;
      setConnections((prev) => prev.filter((x) => x.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [connections, selectedId],
  );

  const runQuery = useCallback(async () => {
    if (!selected) {
      setError("Select a connection first.");
      return;
    }
    // If the user has highlighted text in the SQL editor, run only that.
    // Otherwise run the full script (the backend splits it into statements).
    const ta = sqlRef.current;
    let toRun = sql;
    if (ta && ta.selectionStart !== ta.selectionEnd) {
      toRun = sql.slice(ta.selectionStart, ta.selectionEnd);
    }
    if (!toRun.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    const started = performance.now();
    try {
      const res = await tauriInvoke<QueryResult>("db_query", {
        connection: selected,
        sql: toRun,
      });
      const durationMs = Math.round(performance.now() - started);
      setResult({ ...res, durationMs: res.durationMs ?? durationMs });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/not available|not found|unknown command/i.test(msg)) {
        setError(
          "Database backend is not wired up yet (`db_query` Tauri command missing). " +
            "Connection settings are saved; implement the Rust handler to run queries.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setRunning(false);
    }
  }, [selected, sql]);

  const driverLabel = (d: DbDriver) =>
    DRIVERS.find((x) => x.id === d)?.label ?? d;

  return (
    <div className="db">
      {/* ---------------- Connections list ---------------- */}
      <div className="db__section">
        <div className="db__section-head">
          <span>CONNECTIONS</span>
          <button
            className="db__icon-btn"
            title="New connection"
            onClick={startNew}
          >
            <I.Plus size={13} />
          </button>
        </div>

        <div className="db__conn-list">
          {connections.length === 0 ? (
            <div className="db__empty">
              No connection yet. Click <I.Plus size={11} /> to add one.
            </div>
          ) : (
            connections.map((c) => (
              <div
                key={c.id}
                className={`db__conn-row ${
                  selectedId === c.id ? "is-selected" : ""
                }`}
                onClick={() => setSelectedId(c.id)}
                title={
                  c.driver === "sqlite"
                    ? c.host
                    : `${c.user ?? ""}@${c.host}${
                        c.port ? `:${c.port}` : ""
                      }${c.database ? `/${c.database}` : ""}`
                }
              >
                <I.Database size={14} />
                <div className="db__conn-text">
                  <span className="db__conn-name">{c.name}</span>
                  <span className="db__conn-sub">{driverLabel(c.driver)}</span>
                </div>
                <div className="db__conn-actions">
                  <button
                    className="db__icon-btn"
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(c);
                    }}
                  >
                    <I.Edit size={12} />
                  </button>
                  <button
                    className="db__icon-btn db__icon-btn--danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(c.id);
                    }}
                  >
                    <I.Trash size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---------------- Add / edit form ---------------- */}
      {showForm && editing && (
        <div className="db__section db__form">
          <div className="db__section-head">
            <span>{connections.some((c) => c.id === editing.id) ? "EDIT" : "NEW"}</span>
          </div>
          <div className="db__form-body">
            <label className="db__field">
              <span>Name</span>
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label className="db__field">
              <span>Driver</span>
              <select
                value={editing.driver}
                onChange={(e) => {
                  const driver = e.target.value as DbDriver;
                  const def = DRIVERS.find((d) => d.id === driver);
                  setEditing({
                    ...editing,
                    driver,
                    port: def?.defaultPort,
                  });
                }}
              >
                {DRIVERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            {editing.driver === "sqlite" ? (
              <label className="db__field">
                <span>File path</span>
                <input
                  placeholder="/path/to/database.sqlite"
                  value={editing.host}
                  onChange={(e) =>
                    setEditing({ ...editing, host: e.target.value })
                  }
                />
              </label>
            ) : (
              <>
                <label className="db__field">
                  <span>Host</span>
                  <input
                    placeholder="localhost"
                    value={editing.host}
                    onChange={(e) =>
                      setEditing({ ...editing, host: e.target.value })
                    }
                  />
                </label>
                <label className="db__field">
                  <span>Port</span>
                  <input
                    type="number"
                    value={editing.port ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        port: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label className="db__field">
                  <span>Database</span>
                  <input
                    value={editing.database ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, database: e.target.value })
                    }
                  />
                </label>
                <label className="db__field">
                  <span>User</span>
                  <input
                    value={editing.user ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, user: e.target.value })
                    }
                  />
                </label>
                <label className="db__field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={editing.password ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, password: e.target.value })
                    }
                  />
                </label>
              </>
            )}

            <div className="db__form-actions">
              <button className="db__btn" onClick={cancelForm}>
                Cancel
              </button>
              <button className="db__btn db__btn--primary" onClick={saveForm}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SQL scratchpad ---------------- */}
      <div className="db__section db__sql">
        <div className="db__section-head">
          <span>SQL</span>
          <span className="db__section-sub">
            {selected ? selected.name : "no connection"}
          </span>
        </div>
        <textarea
          ref={sqlRef}
          className="db__sql-input"
          value={sql}
          spellCheck={false}
          onChange={(e) => setSql(e.target.value)}
          onSelect={(e) => {
            const t = e.currentTarget;
            setHasSelection(t.selectionStart !== t.selectionEnd);
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              void runQuery();
            }
          }}
          placeholder="SELECT * FROM ..."
        />
        <div className="db__sql-actions">
          <button
            className="db__btn db__btn--primary"
            onClick={runQuery}
            disabled={running || !selected || !sql.trim()}
            title={
              hasSelection
                ? "Run selection (Ctrl+Enter)"
                : "Run all statements (Ctrl+Enter)"
            }
          >
            {running ? (
              "Running…"
            ) : (
              <>
                <I.Play size={11} /> {hasSelection ? "Run selection" : "Run"}
              </>
            )}
          </button>
        </div>

        {error && <div className="db__error">{error}</div>}

        {result && (
          <div className="db__result">
            <div className="db__result-meta">
              {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
              {typeof result.rowsAffected === "number" && (
                <> · {result.rowsAffected} affected</>
              )}
              {typeof result.durationMs === "number" && (
                <> · {result.durationMs} ms</>
              )}
            </div>
            {result.columns.length > 0 && (
              <div className="db__result-table-wrap">
                <table className="db__result-table">
                  <thead>
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, i) => (
                      <tr key={i}>
                        {result.columns.map((c) => (
                          <td key={c}>{formatCell(r[c])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
