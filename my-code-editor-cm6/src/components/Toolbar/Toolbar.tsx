import "./Toolbar.css";
import type { ThemeName } from "../../types/theme";

interface ToolbarProps {
  onCreateFile: () => void;
  onOpenThemeManager: () => void;
  theme?: string;
  setTheme?: (t: string) => void;
}

export default function Toolbar({
  onCreateFile,
  onOpenThemeManager,
  theme,
  setTheme,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      {/* Sélecteur de thème (optionnel) */}
      <select
        value={theme ?? "joe-dark"}
        onChange={(e) => setTheme?.(e.target.value as ThemeName)}
        className="theme-select"
      >
        <option value="joe-dark">Dark</option>
        <option value="joe-light">Light</option>
      </select>

      {/* Bouton Theme Manager */}
      <button onClick={onOpenThemeManager}>🎨 Thèmes</button>

      {/* Bouton Nouveau fichier */}
      <button onClick={onCreateFile}>📄 Nouveau fichier</button>
    </div>
  );
}
