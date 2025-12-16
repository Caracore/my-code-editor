import "./ContextMenu.css";
import { createPortal } from "react-dom";

interface Props {
  x: number;
  y: number;
  path: string;
  isDir: boolean;
  onRename: () => void;
  // onTrash: () => void;
  // onDelete: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  // path,
  // isDir,
  onRename,
  // onTrash,
  // onDelete,
  onCreateFile,
  onCreateFolder,
  // onClose,
}: Props) {
  return createPortal(
    <div
      className="context-menu"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()} // ✅ Empêche la fermeture automatique
    >
      <div
        className="context-item"
        onClick={(e) => {
          e.stopPropagation();
          onCreateFile();
        }}
      >
        📄 Nouveau fichier
      </div>

      <div
        className="context-item"
        onClick={(e) => {
          e.stopPropagation();
          onCreateFolder();
        }}
      >
        📁 Nouveau dossier
      </div>
      <div
        className="context-item"
        onClick={(e) => {
          e.stopPropagation(); // ✅ Empêche la fermeture
          onRename();
        }}
      >
        ✏️ Renommer
      </div>

      <div
        className="context-item"
        onClick={(e) => {
          e.stopPropagation(); // ✅ Empêche la fermeture
          // onTrash();
        }}
      >
        🗑️ Envoyer à la corbeille
      </div>

      <div
        className="context-item danger"
        onClick={(e) => {
          e.stopPropagation(); // ✅ Empêche la fermeture
          // onDelete();
        }}
      >
        ❌ Supprimer définitivement
      </div>
    </div>,
    document.body, // ✅ rendu hors du sidebar
  );
}
