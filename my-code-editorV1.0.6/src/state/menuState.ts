// menuState.ts
import { invoke } from "@tauri-apps/api/core";
import { menuConfig } from "../components/TopMenu/menuConfig";

export function registerMenuActions() {
  window.addEventListener("menu-action", (e: any) => {
    handleAction(e.detail);
  });

  window.addEventListener("shortcut", (e: any) => {
    handleShortcut(e.detail);
  });
}

function handleAction(action: string) {
  switch (action) {
    case "file:new":
      invoke("create_new_file");
      break;
    case "view:toggleTerminal":
      // toggle state React
      break;
    case "terminal:new":
      invoke("terminal_new");
      break;
  }
}

function handleShortcut(combo: string) {
  const match = findActionByShortcut(combo);
  if (match) handleAction(match.action);
}

function findActionByShortcut(combo: string) {
  for (const menu of menuConfig) {
    for (const item of menu.items) {
      if (item.shortcut === combo) return item;
    }
  }
  return null;
}
