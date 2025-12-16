import React, { useRef, useState } from "react";
import { useThemeManager } from "./useThemeManager";

export default function ThemeManager() {
  const fileInput = useRef<HTMLInputElement>(null);
  const { importTheme, exportTheme } = useThemeManager();
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importTheme(file);

    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
    }
  };

  return (
    <div style={{ padding: 16, color: "white" }}>
      <h2>Theme Manager</h2>

      <button onClick={() => fileInput.current?.click()}>
        Importer un thème JSON
      </button>

      <button onClick={exportTheme} style={{ marginLeft: 8 }}>
        Exporter le thème actuel
      </button>

      <input
        type="file"
        accept="application/json"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {error && (
        <div style={{ marginTop: 12, color: "red" }}>Erreur : {error}</div>
      )}
    </div>
  );
}
