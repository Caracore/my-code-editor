import "./Toolbar.css";
import type { ThemeName } from "../../types/theme";

interface ToolbarProps {
  onCreateFile: () => void;
  onOpenThemeManager: () => void;
  theme?: string;
  setTheme?: (t: string) => void;
}

export default function Toolbar({
  onOpenThemeManager,
  theme,
  setTheme,
}: ToolbarProps) {
  const handleThemeChange = (newTheme: string) => {
    console.log("🔄 Toolbar: Changing theme to:", newTheme);
    setTheme?.(newTheme as ThemeName);
  };

  const clearThemeCache = () => {
    localStorage.removeItem("themeName");
    localStorage.removeItem("customTheme");
    console.log("🧹 Theme cache cleared, reload page");
    window.location.reload();
  };

  return (
    <div className="toolbar">
      {/* Sélecteur de thème (optionnel) */}
      <select
        value={theme ?? "dark"}
        onChange={(e) => handleThemeChange(e.target.value)}
        className="theme-select"
      >
        <option value="dark">🌙 Dark</option>
        <option value="light">☀️ Light</option>
      </select>

      {/* Bouton Theme Manager */}
      <button onClick={onOpenThemeManager}>🎨 Thèmes</button>

      {/* Bouton Debug: Clear Theme Cache */}
      <button 
        onClick={clearThemeCache}
        title="Clear theme cache and reload"
        style={{ fontSize: "11px", padding: "4px 6px" }}
      >
        🧹
      </button>
    </div>
  );
}
