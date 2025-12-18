// src/components/TabsBar/TabsBar.tsx
import { useTabs } from "../../context/TabsContext.tsx";
import "./TabsBar.css";

// Fonction pour obtenir un label unique pour chaque onglet
function getTabLabel(currentPath: string, allPaths: string[]): string {
  const getFilename = (path: string) => path.split(/[/\\]/).pop() || path;
  const getDirname = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts.slice(0, -1).join("/");
  };

  const currentFilename = getFilename(currentPath);
  
  // Vérifier s'il y a d'autres fichiers avec le même nom
  const duplicates = allPaths.filter(path => 
    path !== currentPath && getFilename(path) === currentFilename
  );

  // Si pas de doublons, retourner juste le nom du fichier
  if (duplicates.length === 0) {
    return currentFilename;
  }

  // Si doublons, afficher le chemin minimal pour différencier
  const currentDir = getDirname(currentPath);
  return `${currentFilename} (${currentDir})`;
}

export default function TabsBar() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();
  console.log("TabsBar useTabs ===", useTabs());

  const allPaths = tabs.map(t => t.path);

  return (
    <div className="tabs-bar">
      {tabs.length === 0 && (
        <div className="tabs-empty">Aucun fichier ouvert</div>
      )}

      {tabs.map((tab) => {
        const tabLabel = getTabLabel(tab.path, allPaths);

        return (
          <div
            key={tab.path}
            className={`tab ${activeTab === tab.path ? "active" : ""}`}
            onClick={() => setActiveTab(tab.path)}
          >
            <span className="tab-label">
              {tab.isDirty && <span className="dirty-dot" />}
              <span className="tab-filename">{tabLabel}</span>
            </span>
            
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
