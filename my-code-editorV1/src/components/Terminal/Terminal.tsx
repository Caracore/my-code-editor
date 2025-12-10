interface TerminalProps {
  output: string;
  input: string;
  setInput: (value: string) => void;
  onRun: () => void;
}

export default function Terminal({
  output,
  input,
  setInput,
  onRun,
}: TerminalProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          background: "#000",
          color: "#0f0",
          padding: 8,
          overflowY: "auto",
          fontFamily: "monospace",
        }}
      >
        <pre style={{ margin: 0 }}>{output}</pre>
      </div>

      <div style={{ display: "flex", background: "#111", padding: 4 }}>
        <input
          style={{
            flex: 1,
            background: "#222",
            color: "#0f0",
            border: "none",
            padding: 6,
            fontFamily: "monospace",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onRun()}
        />
        <button onClick={onRun}>Entrer</button>
      </div>
    </div>
  );
}
