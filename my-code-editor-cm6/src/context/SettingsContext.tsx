import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";

interface SettingsContextType {
  shortcuts: Record<string, string>;
  getShortcut: (action: string) => string;
  updateShortcut: (action: string, shortcut: string) => void;
  discordEnabled: boolean;
  toggleDiscord: (enabled: boolean) => void;
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

  return (
    <SettingsContext.Provider
      value={{
        shortcuts: settings.shortcuts,
        getShortcut,
        updateShortcut,
        discordEnabled: settings.discord?.enabled || false,
        toggleDiscord,
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
