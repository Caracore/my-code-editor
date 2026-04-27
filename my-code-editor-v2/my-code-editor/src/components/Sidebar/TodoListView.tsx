import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I } from "../Icons";
import "./TodoListView.css";

/* ---------------------------------------------------------------- */
/*  Persistent Todo / scratch-pad sidebar view                      */
/* ---------------------------------------------------------------- */

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  /** ms timestamp of creation, for stable sort. */
  createdAt: number;
}

const STORAGE_KEY = "my-code-editor:todos:v1";

type Filter = "all" | "active" | "done";

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is TodoItem =>
        t &&
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        typeof t.done === "boolean" &&
        typeof t.createdAt === "number"
    );
  } catch {
    return [];
  }
}

function saveTodos(items: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore (quota / disabled storage)
  }
}

function newId(): string {
  // Avoid relying on crypto.randomUUID (older webviews) — use a short rand.
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export default function TodoListView() {
  const [items, setItems] = useState<TodoItem[]>(() => loadTodos());
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // Persist on every change.
  useEffect(() => {
    saveTodos(items);
  }, [items]);

  // Focus the edit field when opening it.
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const addItem = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [
      ...prev,
      { id: newId(), text, done: false, createdAt: Date.now() },
    ]);
    setDraft("");
  }, [draft]);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startEdit = useCallback((item: TodoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const text = editingText.trim();
    if (!text) {
      // empty -> delete
      setItems((prev) => prev.filter((t) => t.id !== editingId));
    } else {
      setItems((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, text } : t))
      );
    }
    setEditingId(null);
    setEditingText("");
  }, [editingId, editingText]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText("");
  }, []);

  const clearDone = useCallback(() => {
    const remaining = items.length - items.filter((t) => t.done).length;
    if (items.some((t) => t.done)) {
      const ok = window.confirm(
        `Remove ${items.length - remaining} completed task(s)?`
      );
      if (!ok) return;
      setItems((prev) => prev.filter((t) => !t.done));
    }
  }, [items]);

  const visible = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // active first, then by creation order
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.createdAt - b.createdAt;
    });
    if (filter === "active") return sorted.filter((t) => !t.done);
    if (filter === "done") return sorted.filter((t) => t.done);
    return sorted;
  }, [items, filter]);

  const remaining = items.filter((t) => !t.done).length;
  const total = items.length;

  return (
    <div className="todo">
      <div className="todo__add">
        <input
          className="todo__add-input"
          placeholder="Add a task or note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <button
          className="todo__add-btn"
          title="Add task (Enter)"
          onClick={addItem}
          disabled={!draft.trim()}
        >
          <I.Plus size={14} />
        </button>
      </div>

      <div className="todo__filters">
        {(["all", "active", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`todo__filter-btn ${filter === f ? "is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
          </button>
        ))}
        <span className="todo__count">
          {remaining}/{total}
        </span>
      </div>

      <div className="todo__list">
        {visible.length === 0 ? (
          <div className="todo__empty">
            {total === 0
              ? "No tasks yet. Add one above to get started."
              : filter === "active"
              ? "No active tasks. Nice work!"
              : "No completed tasks yet."}
          </div>
        ) : (
          visible.map((t) => (
            <div
              key={t.id}
              className={`todo__row ${t.done ? "is-done" : ""} ${
                editingId === t.id ? "is-editing" : ""
              }`}
            >
              <button
                className="todo__check"
                title={t.done ? "Mark as active" : "Mark as done"}
                onClick={() => toggleItem(t.id)}
              >
                {t.done ? (
                  <I.CheckSquare size={16} />
                ) : (
                  <I.Square size={16} />
                )}
              </button>

              {editingId === t.id ? (
                <input
                  ref={editInputRef}
                  className="todo__edit-input"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEdit();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                  onBlur={commitEdit}
                />
              ) : (
                <span
                  className="todo__text"
                  title="Double-click to edit"
                  onDoubleClick={() => startEdit(t)}
                >
                  {t.text}
                </span>
              )}

              <div className="todo__actions">
                <button
                  className="todo__icon-btn"
                  title="Edit"
                  onClick={() => startEdit(t)}
                >
                  <I.Edit size={13} />
                </button>
                <button
                  className="todo__icon-btn todo__icon-btn--danger"
                  title="Delete"
                  onClick={() => removeItem(t.id)}
                >
                  <I.Trash size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="todo__footer">
        <button
          className="todo__footer-btn"
          onClick={clearDone}
          disabled={!items.some((t) => t.done)}
        >
          Clear completed
        </button>
      </div>
    </div>
  );
}
