import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import "./Terminal.css";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Créer l'instance xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: "#0d0d0d",
        foreground: "#e5e5e5",
        cursor: "#00ff88",
        selectionBackground: "#ffffff40",
      },
      windowsMode: false,
      convertEol: false,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    let unlisten: (() => void) | null = null;

    const setup = async () => {
      // Écouter les sorties AVANT de démarrer le terminal
      unlisten = await listen("terminal-output", (event: any) => {
        console.log("📥 Terminal event received:", event.payload);
        const { id, data } = event.payload;
        if (id === "terminal-1" && data) {
          console.log("✍️ Writing to xterm:", data);
          xterm.write(data);
        }
      });

      console.log("👂 Listener registered, starting terminal...");

      try {
        const result = await invoke("start_terminal", { id: "terminal-1" });
        console.log("✅ Terminal started:", result);
      } catch (err) {
        console.error("❌ Failed to start terminal:", err);
        xterm.writeln("\r\n\x1b[31mError: Failed to start terminal\x1b[0m");
        xterm.writeln(String(err));
      }

      // Envoyer les entrées utilisateur au backend
      xterm.onData(async (data) => {
        console.log("⌨️ User input:", data);
        try {
          await invoke("write_to_terminal", { id: "terminal-1", data });
        } catch (err) {
          console.error("❌ Failed to write:", err);
        }
      });
    };

    setup();

    // Redimensionner le terminal quand la fenêtre change
    const handleResize = () => {
      fitAddon.fit();
      invoke("resize_terminal", {
        id: "terminal-1",
        cols: xterm.cols,
        rows: xterm.rows,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (unlisten) unlisten();
      // Arrêter et nettoyer le terminal
      invoke("stop_terminal", { id: "terminal-1" })
        .then(() => console.log("Terminal stopped"))
        .catch((err) => console.error("Error stopping terminal:", err));
      xterm.dispose();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: "100%",
        height: "100%",
        padding: "10px",
      }}
    />
  );
}
