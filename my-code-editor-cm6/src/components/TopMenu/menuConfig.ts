// menuConfig.ts

// import { MenuSection } from "../../types/menuTypes";

export const getMenuConfig = (shortcuts: Record<string, string>) => [
  {
    label: "File",
    items: [
      { label: "New File", shortcut: shortcuts["file:new"] || "", action: "file:new" },
      { label: "New Folder", shortcut: shortcuts["folder:new"] || "", action: "folder:new" },
      { label: "Open File...", shortcut: shortcuts["file:open"] || "", action: "file:open" },
      { label: "Save", shortcut: shortcuts["file:save"] || "", action: "file:save" },
      { label: "Save As...", shortcut: shortcuts["file:saveAs"] || "", action: "file:saveAs" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: shortcuts["edit:undo"] || "", action: "edit:undo" },
      { label: "Redo", shortcut: shortcuts["edit:redo"] || "", action: "edit:redo" },
      { label: "Copy", shortcut: shortcuts["edit:copy"] || "", action: "edit:copy" },
      { label: "Paste", shortcut: shortcuts["edit:paste"] || "", action: "edit:paste" },
    ],
  },
  {
    label: "View",
    items: [
      {
        label: "Toggle Terminal",
        shortcut: shortcuts["view:toggleTerminal"] || "",
        action: "view:toggleTerminal",
      },
      {
        label: "Toggle Sidebar",
        shortcut: shortcuts["view:toggleSidebar"] || "",
        action: "view:toggleSidebar",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Open Settings", shortcut: "Ctrl+,", action: "settings:open" },
    ],
  },
];
