import { useState } from "react";
import { useTabs } from "../../context/TabsContext";
import { invoke } from "@tauri-apps/api/core";
import { useDroppable } from "@dnd-kit/core";
import logo from "../../assets/logo.png";
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  const [isDragOver, setIsDragOver] = useState(false);
  const { openTab } = useTabs();
  
  // Zone de drop pour les fichiers depuis la sidebar
  const { setNodeRef, isOver: isDndOver } = useDroppable({
    id: "welcome-screen",
    data: { type: "welcome-zone" }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Récupérer les fichiers droppés
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      // Utiliser le chemin du fichier avec l'API Tauri
      const filePath = (file as any).path;
      
      if (filePath) {
        try {
          // Lire le contenu du fichier
          const content = await invoke<string>("read_file", { path: filePath });
          // Ouvrir dans un nouvel onglet
          openTab(filePath, content);
          console.log("✅ Fichier ouvert:", filePath);
        } catch (err) {
          console.error("❌ Erreur lors de l'ouverture du fichier:", err);
          alert(`Erreur lors de l'ouverture de ${file.name}: ${err}`);
        }
      }
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`welcome-screen ${isDragOver || isDndOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="welcome-content">
        <img src={logo} alt="My Code Editor" className="welcome-logo" />
        <h1 className="welcome-title">MY CODE EDITOR</h1>
        <p className="welcome-subtitle">
          {(isDragOver || isDndOver)
            ? "📂 Déposez les fichiers ici pour les ouvrir" 
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
