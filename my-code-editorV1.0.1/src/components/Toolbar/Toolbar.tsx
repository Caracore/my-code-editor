interface ToolbarProps {
  currentPath: string | null;
  terminalVisible: boolean;
  terminalPosition: "bottom" | "right";
  onCreateFile: (name: string) => void;
  onOpen: () => void;
  onSave: () => void;
  onToggleTerminal: () => void;
  onChangeTerminalPosition: (pos: "bottom" | "right") => void;
}

export default function Toolbar({
  currentPath,
  terminalVisible,
  terminalPosition,
  onCreateFile,
  onOpen,
  onSave,
  onToggleTerminal,
  onChangeTerminalPosition,
}: ToolbarProps) {
  return (
    <div
      style={{
        padding: "4px 8px",
        background: "#111",
        color: "#eee",
        display: "flex",
        gap: 8,
      }}
    >
      {/*Changer en chaine string vide plus tard.*/}
      {/*<button onClick={() => onCreateFile("nouveau.txt")}>
        Nouveau fichier
      </button>*/}
      <button onClick={onOpen}>Ouvrir Fichier</button>
      <button onClick={onSave} disabled={!currentPath}>
        Sauvegarder
      </button>
      <button onClick={onToggleTerminal}>
        {terminalVisible ? "Fermer terminal" : "Ouvrir terminal"}
      </button>
      <select
        value={terminalPosition}
        onChange={(e) =>
          onChangeTerminalPosition(e.target.value as "bottom" | "right")
        }
        style={{ marginLeft: 20 }}
      >
        <option value="bottom">Terminal en bas</option>
        <option value="right">Terminal à droite</option>
      </select>
      <span style={{ marginLeft: "auto", opacity: 0.7 }}>
        {currentPath ?? "Nouveau fichier"}
      </span>
    </div>
  );
}

// interface ToolbarProps {
//   currentPath: string | null;
//   terminalVisible: boolean;
//   terminalPosition: "bottom" | "right";
//   onOpen: () => void;
//   onSave: () => void;
//   onToggleTerminal: () => void;
//   onChangeTerminalPosition: (pos: "bottom" | "right") => void;
// }

// export default function Toolbar({
//   currentPath,
//   terminalVisible,
//   terminalPosition,
//   onOpen,
//   onSave,
//   onToggleTerminal,
//   onChangeTerminalPosition,
// }: ToolbarProps) {
//   return (
//     <div
//       style={{
//         padding: "4px 8px",
//         background: "#111",
//         color: "#eee",
//         display: "flex",
//         gap: 8,
//       }}
//     >
//       <button onClick={onOpen}>Ouvrir</button>
//       <button onClick={onSave} disabled={!currentPath}>
//         Sauvegarder
//       </button>
//       <button onClick={onToggleTerminal}>
//         {terminalVisible ? "Fermer terminal" : "Ouvrir terminal"}
//       </button>

//       <select
//         value={terminalPosition}
//         onChange={(e) => onChangeTerminalPosition(e.target.value)}
//         style={{ marginLeft: 20 }}
//       >
//         <option value="bottom">Terminal en bas</option>
//         <option value="right">Terminal à droite</option>
//       </select>

//       <span style={{ marginLeft: "auto", opacity: 0.7 }}>
//         {currentPath ?? "Nouveau fichier"}
//       </span>
//     </div>
//   );
// }
