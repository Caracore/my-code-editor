import { useState, useEffect } from "react";
import "./TodoList.css";

interface Todo {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  completed: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Charger depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // CREATE
  const handleCreate = () => {
    if (!newTitle.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      createdAt: Date.now(),
      completed: false,
    };

    setTodos([newTodo, ...todos]);
    setNewTitle("");
    setNewContent("");
  };

  // UPDATE
  const handleUpdate = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // DELETE
  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette note ?")) {
      setTodos(todos.filter((t) => t.id !== id));
    }
  };

  // Toggle completed
  const toggleComplete = (id: string) => {
    handleUpdate(id, {
      completed: !todos.find((t) => t.id === id)?.completed,
    });
  };

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h2>📝 Notes & Todo</h2>
      </div>

      {/* CREATE FORM */}
      <div className="todo-create">
        <input
          type="text"
          placeholder="Titre de la note..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="todo-input"
        />
        <textarea
          placeholder="Contenu (optionnel)..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="todo-textarea"
          rows={3}
        />
        <button onClick={handleCreate} className="btn-create">
          ✚ Ajouter
        </button>
      </div>

      {/* TODO LIST */}
      <div className="todo-items">
        {todos.length === 0 ? (
          <div className="todo-empty">Aucune note pour le moment</div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${todo.completed ? "completed" : ""}`}
            >
              {editingId === todo.id ? (
                // EDIT MODE
                <div className="todo-edit">
                  <input
                    type="text"
                    value={todo.title}
                    onChange={(e) =>
                      handleUpdate(todo.id, { title: e.target.value })
                    }
                    className="todo-input"
                  />
                  <textarea
                    value={todo.content}
                    onChange={(e) =>
                      handleUpdate(todo.id, { content: e.target.value })
                    }
                    className="todo-textarea"
                    rows={3}
                  />
                  <button
                    onClick={() => setEditingId(null)}
                    className="btn-save"
                  >
                    ✓ Sauvegarder
                  </button>
                </div>
              ) : (
                // VIEW MODE
                <div className="todo-view">
                  <div className="todo-check">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleComplete(todo.id)}
                    />
                  </div>
                  <div className="todo-content">
                    <h3>{todo.title}</h3>
                    {todo.content && <p>{todo.content}</p>}
                    <span className="todo-date">
                      {new Date(todo.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="todo-actions">
                    <button
                      onClick={() => setEditingId(todo.id)}
                      className="btn-edit"
                      title="Éditer"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="btn-delete"
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
