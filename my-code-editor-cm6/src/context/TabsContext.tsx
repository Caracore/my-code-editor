import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface OpenTab {
  path: string;
  content: string;
  isDirty: boolean;
  name: string;
}

interface TabsContextType {
  tabs: OpenTab[];
  activeTab: string | null;
  openTab: (path: string, content: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  updateTabContent: (path: string, newContent: string) => void;
  markTabAsSaved: (path: string) => void;
  reloadTab: (path: string, content: string) => void;
  reorderTabs: (oldIndex: number, newIndex: number) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // 🎮 Fonction pour mettre à jour Discord Presence
  const updateDiscordForTab = async (path: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const fileName = path.split(/[\\/]/).pop() || "Untitled";
      const language = detectLanguageFromPath(path);
      
      await invoke("update_discord_presence", {
        payload: {
          file: fileName,
          language: language,
          project: "My Code Editor"
        }
      });
    } catch (error) {
      // Silencieux si Discord n'est pas activé
    }
  };
  
  const detectLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'JavaScript', 'jsx': 'JavaScript', 'ts': 'TypeScript', 'tsx': 'TypeScript',
      'py': 'Python', 'java': 'Java', 'cpp': 'C++', 'c': 'C', 'cs': 'C#',
      'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP',
      'html': 'HTML', 'css': 'CSS', 'json': 'JSON', 'md': 'Markdown'
    };
    return langMap[ext || ''] || 'Text';
  };

  // ✅ Ouvrir un fichier dans un onglet
  function openTab(path: string, content: string) {
    const existing = tabs.find((t) => t.path === path);

    if (existing) {
      // ✅ Mise à jour du contenu si le fichier a changé sur disque
      if (existing.content !== content) {
        setTabs((prev) =>
          prev.map((t) =>
            t.path === path ? { ...t, content, isDirty: false } : t
          )
        );
      }

      setActiveTab(path);
      // 🎮 Discord Presence lors du changement d'onglet
      updateDiscordForTab(path);
      return;
    }
// modification ici à voir pour changer name: ################################################################################################!!!!!!!!!!!!!!!!!!!
    // ✅ Nouveau tab
    setTabs((prev) => [...prev, { path, content, isDirty: false, name: path.split(/[/\\]/).pop() || "untitled" }]);
    setActiveTab(path);
    // 🎮 Discord Presence lors de l'ouverture d'un nouvel onglet
    updateDiscordForTab(path);
  }

  // ✅ Fermer un onglet
  function closeTab(path: string) {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.path !== path);

      if (activeTab === path) {
        setActiveTab(remaining.length ? remaining[0].path : null);
      }

      return remaining;
    });
  }

  // ✅ Mise à jour du contenu (appelé par CodeMirror)
  function updateTabContent(path: string, newContent: string) {
    setTabs((prev) =>
      prev.map((t) =>
        t.path === path
          ? { ...t, content: newContent, isDirty: true }
          : t
      )
    );
  }

  // ✅ Marquer comme sauvegardé
  function markTabAsSaved(path: string) {
    setTabs((prev) =>
      prev.map((t) =>
        t.path === path ? { ...t, isDirty: false } : t
      )
    );
  }

  // ✅ Recharger depuis le disque
  function reloadTab(path: string, content: string) {
    setTabs((prev) =>
      prev.map((t) =>
        t.path === path ? { ...t, content, isDirty: false } : t
      )
    );
  }

  // ✅ Réorganiser les onglets
  function reorderTabs(oldIndex: number, newIndex: number) {
    setTabs((prev) => {
      const newTabs = [...prev];
      const [movedTab] = newTabs.splice(oldIndex, 1);
      newTabs.splice(newIndex, 0, movedTab);
      return newTabs;
    });
  }

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTab,
        openTab,
        closeTab,
        setActiveTab,
        updateTabContent,
        markTabAsSaved,
        reloadTab,
        reorderTabs,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("useTabs must be used within a TabsProvider");
  return context;
}
