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

      // Trouver l'action correspondante au combo
      const action = Object.keys(shortcuts).find(
        (key) => shortcuts[key] === combo
      );

      if (action) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("menu-action", { detail: action }));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
