// src/components/TabsBar/TabsBar.tsx
import { useTabs } from "../../context/TabsContext.tsx";
import "./TabsBar.css";

export default function TabsBar() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();
  console.log("TabsBar useTabs ===", useTabs());

  return (
    <div className="tabs-bar">
      {tabs.length === 0 && (
        <div className="tabs-empty">Aucun fichier ouvert</div>
      )}

      {tabs.map((tab) => {
        const filename = tab.path.split("/").pop();

        return (
          <div
            key={tab.path}
            className={`tab ${activeTab === tab.path ? "active" : ""}`}
            onClick={() => setActiveTab(tab.path)}
          >
            <span className="tab-label">
              {tab.isDirty && <span className="dirty-dot" />}
              <span className="tab-filename">{filename}</span>
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
