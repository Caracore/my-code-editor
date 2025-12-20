import React, { useState, useEffect, useRef } from "react";
import "./CommandPalette.css";

export interface Command {
  id: string;
  label: string;
  category: string;
  action: string;
  shortcut?: string;
  icon?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  onSelectCommand: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  onSelectCommand,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchTerm("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter commands based on search term
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group commands by category
  const groupedCommands: { [key: string]: Command[] } = {};
  filteredCommands.forEach((cmd) => {
    if (!groupedCommands[cmd.category]) {
      groupedCommands[cmd.category] = [];
    }
    groupedCommands[cmd.category].push(cmd);
  });

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelectCommand(filteredCommands[selectedIndex].action);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleSelectCommand = (action: string) => {
    onSelectCommand(action);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  let commandIndex = 0;

  return (
    <div className="command-palette-overlay" onClick={handleOverlayClick}>
      <div className="command-palette">
        <div className="command-palette-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Tapez une commande ou recherchez..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              Aucune commande trouvée
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="command-palette-category">{category}</div>
                {cmds.map((cmd) => {
                  const currentIndex = commandIndex++;
                  return (
                    <div
                      key={cmd.id}
                      className={`command-palette-item ${
                        currentIndex === selectedIndex ? "selected" : ""
                      }`}
                      onClick={() => handleSelectCommand(cmd.action)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div className="command-palette-item-left">
                        {cmd.icon && (
                          <span className="command-palette-item-icon">
                            {cmd.icon}
                          </span>
                        )}
                        <span className="command-palette-item-label">
                          {cmd.label}
                        </span>
                      </div>
                      {cmd.shortcut && (
                        <span className="command-palette-item-shortcut">
                          {cmd.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
