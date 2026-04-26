// useKeyboardShortcuts.ts
import { useEffect } from "react";
import { useSettingsContext } from "../context/SettingsContext";

export function useKeyboardShortcuts() {
  const { shortcuts } = useSettingsContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const combo = [
        e.ctrlKey ? "Ctrl" : "",
        e.shiftKey ? "Shift" : "",
        e.altKey ? "Alt" : "",
        e.key.length === 1 ? e.key.toUpperCase() : e.key,
      ]
        .filter(Boolean)
        .join("+");

      console.log("🔍 Raccourci détecté:", combo);

      // Trouver l'action correspondante au combo
      const action = Object.keys(shortcuts).find(
        (key) => shortcuts[key] === combo
      );

      if (action) {
        console.log("🔍 Action trouvée:", action);
        
        // Ne RIEN faire pour copier/coller/couper avec raccourcis clavier
        // Ces raccourcis sont gérés nativement par les event listeners de CodeMirror
        // On dispatch l'événement menu-action UNIQUEMENT pour les clics sur le menu
        if (action === "edit:copy" || action === "edit:paste" || action === "edit:cut") {
          console.log("🔍 Raccourci natif ignoré:", action);
          return; // Ne pas preventDefault, ne pas dispatcher l'événement
        }
        
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("menu-action", { detail: action }));
      } else {
        console.log("🔍 Aucune action trouvée pour:", combo);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
