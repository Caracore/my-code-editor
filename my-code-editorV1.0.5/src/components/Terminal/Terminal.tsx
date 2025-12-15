import "./Terminal.css";
import { useRef } from "react";

interface TerminalProps {
  output: string;
  input: string;
  setInput: (value: string) => void;
  onRun: () => void;
  terminalPrompt: string; // ✅ nouveau
  terminalShell: "cmd" | "bash"; // ✅ nouveau
  setTerminalShell: (value: "cmd" | "bash") => void; // ✅ nouveau
  onHistoryUp: () => void;
  onHistoryDown: () => void;
}

export default function Terminal({
  output,
  input,
  setInput,
  onRun,
  terminalPrompt,
  terminalShell, // ✅
  setTerminalShell, // ✅
  onHistoryUp,
  onHistoryDown,
}: TerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="terminal-container">
      <div className="terminal">
        <pre>{output}</pre>
      </div>

      <div className="input-container">
        <span className="terminal-prompt">{terminalPrompt}</span>
        <input
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onRun();
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              onHistoryUp();
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onHistoryDown();
            }
          }}

          // onKeyDown={(e) => e.key === "Enter" && onRun()}
          // onKeyDown={(e) => {
          //   if (e.key === "Enter" && !e.shiftKey) {
          //     e.preventDefault();
          //     onRun();
          // }
          // }}
        />
        <button className="terminal-button" onClick={onRun}>
          Entrer
        </button>
        {/* ✅ Sélecteur de shell */}
        <select
          className="terminal-shell-select"
          value={terminalShell}
          onChange={(e) => setTerminalShell(e.target.value as "cmd" | "bash")}
        >
          <option value="cmd">CMD</option>
          <option value="bash">Git Bash</option>
        </select>
      </div>
    </div>
  );
}
