import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Settings {
  shortcuts: Record<string, string>;
  theme: {
    default: string;
  };
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: string;
  };
  discord: {
    enabled: boolean;
  };
  lsp: {
    enabled: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
  shortcuts: {
    "file:new": "Ctrl+N",
    "folder:new": "Ctrl+Shift+N",
    "file:open": "Ctrl+O",
    "file:save": "Ctrl+S",
    "file:saveAs": "Ctrl+Shift+S",
    "edit:undo": "Ctrl+Z",
    "edit:redo": "Ctrl+Y",
    "edit:copy": "Ctrl+C",
    "edit:cut": "Ctrl+X",
    "edit:paste": "Ctrl+V",
    "view:toggleTerminal": "Ctrl+ù",
    "view:toggleSidebar": "Ctrl+B",
    "view:toggleTodoList": "Ctrl+T",
    "search:toggle": "Ctrl+F",
    "terminal:new": "Ctrl+Shift+`",
    "settings:open": "Ctrl+,"
  },
  theme: {
    default: "vs-dark",
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: "on",
  },
  discord: {
    enabled: false,
  },
  lsp: {
    enabled: true,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const configDir = await invoke<string>("get_config_path");
      const settingsPath = `${configDir}\\settings.json`;
      
      const content = await invoke<string>("read_settings", { path: settingsPath });
      const parsed = JSON.parse(content);
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch (err) {
      console.warn("Impossible de charger settings.json, utilisation des valeurs par défaut", err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(newSettings: Settings) {
    try {
      const configDir = await invoke<string>("get_config_path");
      const settingsPath = `${configDir}\\settings.json`;
      
      await invoke("write_settings", {
        path: settingsPath,
        content: JSON.stringify(newSettings, null, 2),
      });
      setSettings(newSettings);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde des settings:", err);
    }
  }

  return { settings, loading, saveSettings, reloadSettings: loadSettings };
}
