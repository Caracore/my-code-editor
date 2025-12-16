// menuConfig.ts

// import { MenuSection } from "../../types/menuTypes";

export const menuConfig = [
  {
    label: "File",
    items: [
      { label: "New File", shortcut: "Ctrl+N", action: "file:new" },
      { label: "New Folder", shortcut: "Ctrl+Shift+N", action: "folder:new" },
      { label: "Open File...", shortcut: "Ctrl+O", action: "file:open" },
      { label: "Save", shortcut: "Ctrl+S", action: "file:save" },
      { label: "Save As...", shortcut: "Ctrl+Shift+S", action: "file:saveAs" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "Ctrl+Z", action: "edit:undo" },
      { label: "Redo", shortcut: "Ctrl+Y", action: "edit:redo" },
      { label: "Copy", shortcut: "Ctrl+C", action: "edit:copy" },
      { label: "Paste", shortcut: "Ctrl+V", action: "edit:paste" },
    ],
  },
  {
    label: "View",
    items: [
      {
        label: "Toggle Terminal",
        shortcut: "Ctrl+`",
        action: "view:toggleTerminal",
      },
      {
        label: "Toggle Sidebar",
        shortcut: "Ctrl+B",
        action: "view:toggleSidebar",
      },
    ],
  },
  {
    label: "Terminal",
    items: [
      {
        label: "New Terminal",
        shortcut: "Ctrl+Shift+`",
        action: "terminal:new",
      },
      { label: "Switch Shell", shortcut: "", action: "terminal:switchShell" },
    ],
  },
];
