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
}: TerminalContainerProps) {
  if (!visible) return null;

  const isRight = position === "right";

  return (
    <>
      <div
        onMouseDown={onResize}
        style={{
          width: isRight ? "5px" : "100%",
          height: isRight ? "100%" : "5px",
          cursor: isRight ? "col-resize" : "row-resize",
          background: "#333",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          width: isRight ? width : "100%",
          height: isRight ? "100%" : height,
          flexShrink: 0,
        }}
      >
        <Terminal
          output={output}
          input={input}
          setInput={setInput}
          onRun={onRun}
        />
      </div>
    </>
  );
}
