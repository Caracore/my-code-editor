import "./Toolbar.css";
import type { ThemeName } from "../../types/theme";

interface ToolbarProps {
  // currentPath: string | null;
  terminalVisible: boolean;
  terminalPosition: "bottom" | "right";
  onCreateFile: (name: string) => void;
  // onOpen: () => void;
  // onSave: () => void;
  onToggleTerminal: () => void;
  onChangeTerminalPosition: (pos: "bottom" | "right") => void;
  theme: ThemeName;
  setTheme: (value: ThemeName) => void;
  terminalShell: "cmd" | "bash";
  setTerminalShell: React.Dispatch<React.SetStateAction<"cmd" | "bash">>;
  onOpenThemeManager: () => void;
}

export default function Toolbar({
  // currentPath,
  terminalVisible,
  terminalPosition,
  // onOpen,
  // onSave,
  onToggleTerminal,
  onChangeTerminalPosition,
  theme,
  setTheme,
  terminalShell,
  setTerminalShell,
  onOpenThemeManager,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        className="theme-select"
      >
        {/*Changer les nom de joe en mycode editor*/}
        <option value="joe-dark">My C0de Editor Dark</option>
        <option value="joe-light">My C0de Editor Light</option>
      </select>
      {/* ✅ Bouton Theme Manager (en dehors du select !) */}
      <button onClick={onOpenThemeManager}>🎨 Thèmes</button>
      {/*<button onClick={onOpen}>Ouvrir Fichier</button>*/}
      {/*<button onClick={onSave} disabled={!currentPath}>*/}
      {/*Sauvegarder*/}
      {/*</button>*/}
      <button onClick={onToggleTerminal}>
        {terminalVisible ? "Fermer terminal" : "Ouvrir terminal"}
      </button>
      <select
        className="toolbar-select"
        value={terminalPosition}
        onChange={(e) =>
          onChangeTerminalPosition(e.target.value as "bottom" | "right")
        }
        style={{ marginLeft: 20 }}
      >
        <option value="bottom">Terminal en bas</option>
        <option value="right">Terminal à droite</option>
      </select>
      <input
        type="checkbox"
        checked={terminalShell === "bash"}
        onChange={() =>
          setTerminalShell((shell: "cmd" | "bash") =>
            shell === "cmd" ? "bash" : "cmd",
          )
        }
      />
      <label typeof="text">Bash | CMD</label>

      {/*<button
        onClick={() =>
          setTerminalShell((shell) => (shell === "cmd" ? "bash" : "cmd"))
        }
      >
        {terminalShell === "cmd" ? "Switch to Bash" : "Switch to CMD"}
      </button>*/}
      {/*<span style={{ marginLeft: "auto", opacity: 0.7 }}>
        {currentPath ?? "Nouveau fichier"}*/}
      {/*Supprimer le current path à l'affichage plus tard peut-être ?*/}
      {/*</span>*/}
    </div>
  );
}
