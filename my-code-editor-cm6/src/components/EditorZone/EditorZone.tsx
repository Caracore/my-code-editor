import { useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import "./EditorZone.css";

type DropZone = "left" | "right" | "center";

interface EditorZoneProps {
  children: React.ReactNode;
  onFileDrop?: (zone: DropZone) => void;
}

export default function EditorZone({ children, onFileDrop }: EditorZoneProps) {
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<DropZone>("center");

  // Zone de drop pour recevoir des fichiers depuis la Sidebar
  const { setNodeRef, isOver } = useDroppable({
    id: "editor-zone",
    data: { type: "editor-zone", getZone: () => dropZoneRef.current }
  });

  // Suivre la position de la souris pour détecter la zone
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOver || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    const edgeThreshold = 0.25;
    
    let zone: DropZone = "center";
    if (x < width * edgeThreshold) {
      zone = "left";
    } else if (x > width * (1 - edgeThreshold)) {
      zone = "right";
    }
    
    setDropZone(zone);
    dropZoneRef.current = zone;
  };

  // Combiner les refs
  const combinedRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    setNodeRef(node);
  };

  return (
    <div
      ref={combinedRef}
      className={`editor-zone ${isOver ? "drag-active" : ""}`}
      onMouseMove={handleMouseMove}
    >
      {/* Indicateurs de zones de drop */}
      {isOver && (
        <>
          <div className={`split-indicator split-left ${dropZone === "left" ? "active" : ""}`}>
            <span className="split-label">← Split</span>
          </div>
          <div className={`split-indicator split-right ${dropZone === "right" ? "active" : ""}`}>
            <span className="split-label">Split →</span>
          </div>
        </>
      )}

      {children}
    </div>
  );
}
