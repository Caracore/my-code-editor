// src/components/TabsBar/TabsBar.tsx
import { useTabs } from "../../context/TabsContext.tsx";
import "./TabsBar.css";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// Composant pour un onglet draggable
function SortableTab({ tab, isActive, allPaths }: { tab: any, isActive: boolean, allPaths: string[] }) {
  const { setActiveTab, closeTab } = useTabs();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const tabLabel = getTabLabel(tab.path, allPaths);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tab ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={() => setActiveTab(tab.path)}
      {...attributes}
      {...listeners}
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
        onPointerDown={(e) => e.stopPropagation()} // Empêcher le drag sur le bouton close
      >
        ×
      </button>
    </div>
  );
}

export default function TabsBar() {
  const { tabs, activeTab, reorderTabs } = useTabs();
  console.log("TabsBar useTabs ===", useTabs());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tabs.findIndex((t) => t.path === active.id);
    const newIndex = tabs.findIndex((t) => t.path === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTabs(oldIndex, newIndex);
    }
  }

  const allPaths = tabs.map(t => t.path);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tabs.map(t => t.path)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="tabs-bar">
          {tabs.length === 0 && (
            <div className="tabs-empty">Aucun fichier ouvert</div>
          )}

          {tabs.map((tab) => (
            <SortableTab
              key={tab.path}
              tab={tab}
              isActive={activeTab === tab.path}
              allPaths={allPaths}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
