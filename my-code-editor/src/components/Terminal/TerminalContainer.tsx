import Terminal from "./Terminal";
import "./TerminalContainer.css";

interface TerminalContainerProps {
  position: "bottom" | "right";
  visible: boolean;
  width: number;
  height: number;
  onResize: (e: React.MouseEvent) => void;
  output: string;
  input: string;
  setInput: (value: string) => void;
  onRun: () => void;
  terminalPrompt: string;
  terminalShell: "cmd" | "bash";
  setTerminalShell: (value: "cmd" | "bash") => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
}

export default function TerminalContainer({
  position,
  visible,
  width,
  height,
  onResize,
  output,
  input,
  setInput,
  onRun,
  terminalPrompt,
  terminalShell,
  setTerminalShell,
  onHistoryUp,
  onHistoryDown,
}: TerminalContainerProps) {
  if (!visible) return null;

  const isRight = position === "right";

  return (
    <>
      {/* ✅ Handle */}
      <div
        onMouseDown={onResize}
        className={`terminal-handle ${
          isRight ? "terminal-handle-vertical" : "terminal-handle-horizontal"
        }`}
      />

      {/* ✅ Terminal container */}
      <div
        className={`terminal-wrapper ${
          isRight ? "terminal-right" : "terminal-bottom"
        }`}
        style={{
          width: isRight ? width : "100%",
          height: isRight ? "100%" : height,
        }}
      >
        <Terminal
          output={output}
          input={input}
          setInput={setInput}
          onRun={onRun}
          terminalPrompt={terminalPrompt}
          terminalShell={terminalShell} // ✅ AJOUTER
          setTerminalShell={setTerminalShell} // ✅ AJOUTER
          onHistoryUp={onHistoryUp}
          onHistoryDown={onHistoryDown}
        />
      </div>
    </>
  );
}
