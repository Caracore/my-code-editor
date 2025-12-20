import { useState } from "react";
import { useSettingsContext } from "../../context/SettingsContext";
import { invoke } from "@tauri-apps/api/core";
import "./SettingsPanel.css";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { shortcuts, updateShortcut, discordEnabled, toggleDiscord } = useSettingsContext();
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [newShortcut, setNewShortcut] = useState("");

  const actionLabels: Record<string, string> = {
    "file:new": "Nouveau fichier",
    "folder:new": "Nouveau dossier",
    "file:open": "Ouvrir fichier",
    "file:save": "Sauvegarder",
    "file:saveAs": "Sauvegarder sous",
    "edit:undo": "Annuler",
    "edit:redo": "Refaire",
    "edit:copy": "Copier",
    "edit:paste": "Coller",
    "view:toggleTerminal": "Toggle Terminal",
    "view:toggleSidebar": "Toggle Sidebar",
    "search:toggle": "Toggle Recherche",
    // "terminal:new": "Nouveau Terminal",
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    e.preventDefault();
    const combo = [
      e.ctrlKey ? "Ctrl" : "",
      e.shiftKey ? "Shift" : "",
      e.altKey ? "Alt" : "",
      e.key.length === 1 ? e.key.toUpperCase() : e.key,
    ]
      .filter(Boolean)
      .join("+");

    setNewShortcut(combo);
  }

  function saveShortcut(action: string) {
    if (newShortcut) {
      updateShortcut(action, newShortcut);
    }
    setEditingAction(null);
    setNewShortcut("");
  }

  async function handleDiscordToggle(enabled: boolean) {
    try {
      if (enabled) {
        await invoke("init_discord_rpc");
      } else {
        await invoke("disconnect_discord_rpc");
      }
      toggleDiscord(enabled);
    } catch (error) {
      console.error("Erreur lors de la configuration de Discord RPC:", error);
    }
  }

  return (
    <div className="settings-panel-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Paramètres</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="settings-content">
          <h3>Discord Rich Presence</h3>
          <div className="settings-section">
            <label className="settings-toggle">
              <span>Activer Discord Rich Presence</span>
              <input
                type="checkbox"
                checked={discordEnabled}
                onChange={(e) => handleDiscordToggle(e.target.checked)}
              />
            </label>
          </div>

          <h3>Raccourcis clavier</h3>
          <div className="shortcuts-list">
            {Object.entries(shortcuts).map(([action, shortcut]) => (
              <div key={action} className="shortcut-item">
                <span className="action-label">
                  {actionLabels[action] || action}
                </span>

                {editingAction === action ? (
                  <div className="shortcut-edit">
                    <input
                      autoFocus
                      value={newShortcut || "Appuyez sur une combinaison..."}
                      onKeyDown={(e) => handleKeyDown(e)}
                      readOnly
                      className="shortcut-input"
                    />
                    <button onClick={() => saveShortcut(action)}>✓</button>
                    <button onClick={() => setEditingAction(null)}>✗</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{shortcut}</kbd>
                    <button
                      onClick={() => {
                        setEditingAction(action);
                        setNewShortcut("");
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
