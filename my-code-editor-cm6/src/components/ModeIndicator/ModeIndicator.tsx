import { useMode } from "../../context/ModeContext";
import "./ModeIndicator.css";

export function ModeIndicator() {
  const { mode } = useMode();
  
  const modeConfig = {
    normal: { label: "NORMAL", color: "#4CAF50", bg: "rgba(76, 175, 80, 0.2)" },
    insert: { label: "INSERT", color: "#2196F3", bg: "rgba(33, 150, 243, 0.2)" },
    hint: { label: "HINT", color: "#FFCC00", bg: "rgba(255, 204, 0, 0.2)" },
  };
  
  const config = modeConfig[mode];
  
  return (
    <div 
      className="mode-indicator"
      style={{ 
        color: config.color,
        backgroundColor: config.bg,
        borderColor: config.color,
      }}
    >
      -- {config.label} --
    </div>
  );
}

export default ModeIndicator;
