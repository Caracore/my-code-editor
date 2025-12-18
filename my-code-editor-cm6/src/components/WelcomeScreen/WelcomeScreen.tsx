import { useState, useRef } from "react";
import { useTabs } from "../../context/TabsContext";
import { invoke } from "@tauri-apps/api/core";
import { useDroppable } from "@dnd-kit/core";
import logo from "../../assets/logo.png";
import "./WelcomeScreen.css";

type DropZone = "center" | "left" | "right" | "top" | "bottom" | null;

export default function WelcomeScreen() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropZone, setDropZone] = useState<DropZone>(null);
  const { openTab: _openTab } = useTabs();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zone de drop pour les fichiers depuis la sidebar
  const { setNodeRef, isOver: isDndOver } = useDroppable({
    id: "welcome-screen",
    data: { type: "welcome-zone" }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);

    // Détecter la zone de drop selon la position de la souris (seulement gauche/droite)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      // Zones de 30% sur les bords gauche et droite
      const edgeThreshold = 0.3;
      
      if (x < width * edgeThreshold) {
        setDropZone("left");
      } else if (x > width * (1 - edgeThreshold)) {
        setDropZone("right");
      } else {
        setDropZone("center");
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropZone(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentDropZone = dropZone;
    setIsDragOver(false);
    setDropZone(null);

    // Récupérer les fichiers droppés
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      // Utiliser le chemin du fichier avec l'API Tauri
      const filePath = (file as any).path;
      
      if (filePath) {
        try {
          // Lire le contenu du fichier
          const content = await invoke<string>("read_file", { path: filePath });
          
          // Dispatcher un événement avec la zone de drop
          window.dispatchEvent(new CustomEvent("open-file-in-zone", {
            detail: {
              path: filePath,
              content: content,
              zone: currentDropZone || "center"
            }
          }));
          
          console.log("✅ Fichier ouvert dans zone:", currentDropZone, filePath);
        } catch (err) {
          console.error("❌ Erreur lors de l'ouverture du fichier:", err);
          alert(`Erreur lors de l'ouverture de ${file.name}: ${err}`);
        }
      }
    }
  };

  // Combiner les refs
  const combinedRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    setNodeRef(node);
  };

  return (
    <div 
      ref={combinedRef}
      className={`welcome-screen ${isDragOver || isDndOver ? "drag-over" : ""} ${dropZone ? `drop-zone-${dropZone}` : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Zones de drop visuelles */}
      {(isDragOver || isDndOver) && (
        <>
          <div className={`drop-indicator drop-left ${dropZone === "left" ? "active" : ""}`}>
            <span className="drop-label">← Split Gauche</span>
          </div>
          <div className={`drop-indicator drop-right ${dropZone === "right" ? "active" : ""}`}>
            <span className="drop-label">Split Droite →</span>
          </div>
        </>
      )}

      <div className="welcome-content">
        <img src={logo} alt="My Code Editor" className="welcome-logo" />
        <h1 className="welcome-title">MY CODE EDITOR</h1>
        <p className="welcome-subtitle">
          {(isDragOver || isDndOver)
            ? dropZone && dropZone !== "center"
              ? `📂 Split ${dropZone === "left" ? "Gauche" : "Droite"}`
              : "📂 Déposez les fichiers ici pour les ouvrir"
            : "Ouvrez un fichier ou un dossier pour commencer"
          }
        </p>
        <div className="welcome-shortcuts">
          <div className="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>O</kbd> <span>Ouvrir un fichier</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>N</kbd> <span>Nouveau fichier</span>
          </div>
          <div className="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>S</kbd> <span>Sauvegarder</span>
          </div>
        </div>
        <p className="welcome-drag-hint">
          💡 Vous pouvez aussi glisser-déposer des fichiers ici
        </p>
      </div>
    </div>
  );
}
