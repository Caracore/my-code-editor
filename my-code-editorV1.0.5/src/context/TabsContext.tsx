import { createContext, useContext, useState, ReactNode } from "react";
import * as monaco from "monaco-editor";

interface OpenTab {
  path: string;
  model: monaco.editor.ITextModel;
}

interface TabsContextType {
  tabs: OpenTab[];
  activeTab: string | null;
  openTab: (path: string, content: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  function openTab(path: string, content: string) {
    const uri = monaco.Uri.file(path);
    const existingModel = monaco.editor.getModel(uri);

    if (existingModel) {
      console.log("📄 Modèle déjà existant :", uri.toString());
      setTabs((prev) => {
        const alreadyInTabs = prev.find((t) => t.path === path);
        if (alreadyInTabs) return prev;
        return [...prev, { path, model: existingModel }];
      });
      setActiveTab(path);
      return;
    }

    const model = monaco.editor.createModel(content, undefined, uri);
    console.log("📄 Nouveau modèle créé :", uri.toString());

    setTabs((prev) => [...prev, { path, model }]);
    setActiveTab(path);
  }

  function closeTab(path: string) {
    setTabs((prevTabs) => {
      const remaining = prevTabs.filter((t) => t.path !== path);

      const closed = prevTabs.find((t) => t.path === path);
      closed?.model.dispose();

      if (activeTab === path) {
        setActiveTab(remaining.length ? remaining[0].path : null);
      }

      return remaining;
    });
  }

  return (
    <TabsContext.Provider
      value={{ tabs, activeTab, openTab, closeTab, setActiveTab }}
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
