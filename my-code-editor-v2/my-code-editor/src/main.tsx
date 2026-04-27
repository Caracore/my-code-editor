import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Disable the browser's default context menu globally so the app's
// custom menus are the only ones that appear. Components that need a
// native menu can call `e.stopPropagation()` (for example, regular
// <input>/<textarea> fields keep their right-click via the OS).
window.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement | null;
  // Allow native menu inside form fields so users keep copy/paste/spellcheck.
  if (target && target.closest("input, textarea, [contenteditable=\"true\"]")) {
    return;
  }
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
