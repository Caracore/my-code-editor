import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";

interface OpacitySettings {
  sidebar: number;
  editor: number;
  terminal: number;
  tabsBar: number;
  toolbar: number;
}

interface SettingsContextType {
  shortcuts: Record<string, string>;
  getShortcut: (action: string) => string;
  updateShortcut: (action: string, shortcut: string) => void;
  discordEnabled: boolean;
  toggleDiscord: (enabled: boolean) => void;
  lspEnabled: boolean;
  toggleLsp: (enabled: boolean) => void;
  jumpLabelsEnabled: boolean;
  toggleJumpLabels: (enabled: boolean) => void;
  opacity: OpacitySettings;
  updateOpacity: (zone: keyof OpacitySettings, value: number) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, loading, saveSettings } = useSettings();

  function getShortcut(action: string): string {
    return settings.shortcuts[action] || "";
  }

  function updateShortcut(action: string, shortcut: string) {
    const newSettings = {
      ...settings,
      shortcuts: {
        ...settings.shortcuts,
        [action]: shortcut,
      },
    };
    saveSettings(newSettings);
  }

  function toggleDiscord(enabled: boolean) {
    const newSettings = {
      ...settings,
      discord: {
        enabled,
      },
    };
    saveSettings(newSettings);
  }

  function toggleLsp(enabled: boolean) {
    const newSettings = {
      ...settings,
      lsp: {
        enabled,
      },
    };
    saveSettings(newSettings);
  }

  function toggleJumpLabels(enabled: boolean) {
    const newSettings = {
      ...settings,
      jumpLabels: {
        enabled,
      },
    };
    saveSettings(newSettings);
  }

  function updateOpacity(zone: keyof OpacitySettings, value: number) {
    const newSettings = {
      ...settings,
      opacity: {
        ...settings.opacity,
        [zone]: Math.max(0.1, Math.min(1.0, value)),
      },
    };
    saveSettings(newSettings);
  }

  const defaultOpacity: OpacitySettings = {
    sidebar: 1.0,
    editor: 1.0,
    terminal: 1.0,
    tabsBar: 1.0,
    toolbar: 1.0,
  };

  return (
    <SettingsContext.Provider
      value={{
        shortcuts: settings.shortcuts,
        getShortcut,
        updateShortcut,
        discordEnabled: settings.discord?.enabled || false,
        toggleDiscord,
        lspEnabled: settings.lsp?.enabled ?? true,
        toggleLsp,
        jumpLabelsEnabled: settings.jumpLabels?.enabled ?? true,
        toggleJumpLabels,
        opacity: settings.opacity || defaultOpacity,
        updateOpacity,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsContext must be used within SettingsProvider");
  }
  return context;
}
