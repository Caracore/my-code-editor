import { useMemo } from "react";
import "./TabsBar.css";

interface SplitTabBarProps {
  filePath: string;
  isDirty: boolean;
  onClose: () => void;
}

export default function SplitTabBar({ filePath, isDirty, onClose }: SplitTabBarProps) {
  const fileName = useMemo(() => {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  }, [filePath]);

  return (
    <div className="tabs-bar split-tab-bar">
      <div className="tab active">
        <span className="tab-label">
          {isDirty && <span className="dirty-dot" />}
          <span className="tab-filename">{fileName}</span>
        </span>
        <button
          className="tab-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Fermer le split"
        >
          ×
        </button>
      </div>
    </div>
  );
}
