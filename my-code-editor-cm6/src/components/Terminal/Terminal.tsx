import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import "./Terminal.css";

interface TerminalProps {
  terminalId: string;
}

export default function Terminal({ terminalId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Récupérer les couleurs depuis les variables CSS
    const getComputedColor = (varName: string) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    };

    // Créer l'instance xterm avec les variables CSS
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: getComputedColor("--terminal-bg") || "#0d0d0d",
        foreground: getComputedColor("--terminal-fg") || "#e5e5e5",
        cursor: getComputedColor("--editor-cursor") || "#00ff88",
        selectionBackground: getComputedColor("--terminal-selection-bg") || "#ffffff40",
        black: getComputedColor("--xterm-black") || "#000000",
        red: getComputedColor("--xterm-red") || "#cd3131",
        green: getComputedColor("--xterm-green") || "#0dbc79",
        yellow: getComputedColor("--xterm-yellow") || "#e5e510",
        blue: getComputedColor("--xterm-blue") || "#2472c8",
        magenta: getComputedColor("--xterm-magenta") || "#bc3fbc",
        cyan: getComputedColor("--xterm-cyan") || "#11a8cd",
        white: getComputedColor("--xterm-white") || "#e5e5e5",
        brightBlack: getComputedColor("--xterm-bright-black") || "#666666",
        brightRed: getComputedColor("--xterm-bright-red") || "#f14c4c",
        brightGreen: getComputedColor("--xterm-bright-green") || "#23d18b",
        brightYellow: getComputedColor("--xterm-bright-yellow") || "#f5f543",
        brightBlue: getComputedColor("--xterm-bright-blue") || "#3b8eea",
        brightMagenta: getComputedColor("--xterm-bright-magenta") || "#d670d6",
        brightCyan: getComputedColor("--xterm-bright-cyan") || "#29b8db",
        brightWhite: getComputedColor("--xterm-bright-white") || "#ffffff",
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
        if (id === terminalId && data) {
          console.log("✍️ Writing to xterm:", data);
          xterm.write(data);
        }
      });

      console.log("👂 Listener registered, starting terminal...");

      try {
        // Essayer de démarrer le terminal, le backend doit gérer si déjà existant
        const result = await invoke("start_terminal", { id: terminalId });
        console.log("✅ Terminal started:", result);
      } catch (err) {
        const errMsg = String(err);
        // Si le terminal existe déjà, ce n'est pas une vraie erreur
        if (errMsg.includes("already") || errMsg.includes("existe")) {
          console.log("ℹ️ Terminal already exists:", terminalId);
        } else {
          console.error("❌ Failed to start terminal:", err);
          xterm.writeln("\r\n\x1b[31mError: Failed to start terminal\x1b[0m");
          xterm.writeln(errMsg);
        }
      }

      // Envoyer les entrées utilisateur au backend
      xterm.onData(async (data) => {
        console.log("⌨️ User input:", data);
        try {
          await invoke("write_to_terminal", { id: terminalId, data });
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
        id: terminalId,
        cols: xterm.cols,
        rows: xterm.rows,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (unlisten) unlisten();
      // Arrêter et nettoyer le terminal
      invoke("stop_terminal", { id: terminalId })
        .then(() => console.log("Terminal stopped"))
        .catch((err) => console.error("Error stopping terminal:", err));
      xterm.dispose();
    };
  }, [terminalId]);

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
