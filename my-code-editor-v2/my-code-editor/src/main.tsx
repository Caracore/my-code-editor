import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DEVTOOLS_ENABLED } from "./config/devTools";

// Disable the browser's default context menu globally so the app's
// custom menus are the only ones that appear. Components that need a
// native menu can call `e.stopPropagation()` (for example, regular
// <input>/<textarea> fields keep their right-click via the OS).
//
// In dev builds we leave the inspector accessible (right-click "Inspect",
// F12, Ctrl+Shift+I). In production these are blocked.
window.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement | null;
  // Allow native menu inside form fields so users keep copy/paste/spellcheck.
  if (target && target.closest("input, textarea, [contenteditable=\"true\"]")) {
    return;
  }
  e.preventDefault();
});

if (!DEVTOOLS_ENABLED) {
  // Block the well-known devtools shortcuts in production builds.
  window.addEventListener(
    "keydown",
    (e) => {
      const isF12 = e.key === "F12";
      const isInspect =
        (e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase());
      const isViewSource = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u";
      if (isF12 || isInspect || isViewSource) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true },
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
