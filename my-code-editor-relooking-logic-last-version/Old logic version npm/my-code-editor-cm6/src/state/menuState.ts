// menuState.ts
import { invoke } from "@tauri-apps/api/core";
import { getMenuConfig } from "../components/TopMenu/menuConfig";

export function registerMenuActions() {
  window.addEventListener("menu-action", (e: any) => {
    handleAction(e.detail);
  });

  window.addEventListener("shortcut", (e: any) => {
    handleShortcut(e.detail);
  });
}

function handleAction(action: string) {
  console.log("🔍 handleAction appelé avec:", action);
  switch (action) {
    case "file:new":
      invoke("create_new_file");
      break;
    case "file:save":
      console.log("🔍 file:save détecté, appel de saveCurrentFile()");
      saveCurrentFile();
      break;
    case "view:toggleTerminal":
      // toggle state React
      break;
    case "terminal:new":
      invoke("terminal_new");
      break;
  }
}

function saveCurrentFile() {
  console.log("🔍 saveCurrentFile() - Dispatch de l'événement save-file");
  // Déclencher un événement personnalisé pour que le MainLayout gère la sauvegarde
  window.dispatchEvent(new CustomEvent("save-file"));
}

function handleShortcut(combo: string) {
  const match = findActionByShortcut(combo);
  if (match) handleAction(match.action);
}

function findActionByShortcut(combo: string) {
  const menuConfig = getMenuConfig({});
  for (const menu of menuConfig) {
    for (const item of menu.items) {
      if (item.shortcut === combo) return item;
    }
  }
  return null;
}
