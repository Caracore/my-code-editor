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
      // Désactiver les séquences ANSI automatiques qui font planter cmd.exe
      windowsMode: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    let unlisten: (() => void) | null = null;

    const setup = async () => {
      try {
        // Tenter d'arrêter le terminal existant d'abord
        try {
          await invoke("stop_terminal", { id: "terminal-1" });
          console.log("Stopped existing terminal");
          // Attendre que le processus se termine vraiment
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.log("No existing terminal to stop");
        }

        // Le backend gère automatiquement le nettoyage si le terminal existe encore
        await invoke("start_terminal", { id: "terminal-1" });
        console.log("Terminal started successfully");
      } catch (err) {
        console.error("Failed to start terminal:", err);
        xterm.writeln("\r\n\x1b[31mError: Failed to start terminal\x1b[0m");
        xterm.writeln(String(err));
      }

      // Écouter les sorties du terminal EN PREMIER
      unlisten = await listen("terminal-output", (event: any) => {
        console.log("Received from terminal:", event.payload);
        const { id, data } = event.payload;
        console.log("Terminal ID:", id, "Data:", data);
        if (id === "terminal-1" && data) {
          xterm.write(data);
        }
      });

      // Envoyer les entrées utilisateur au backend (filtrer les séquences de contrôle)
      xterm.onData(async (data) => {
        // Ignorer les séquences ANSI de contrôle automatiques
        if (data.includes('\x1b[6n') || data.includes('\x1b[?')) {
          console.log("Ignoring control sequence:", data);
          return;
        }
        console.log("Sending to terminal:", data);
        try {
          await invoke("write_to_terminal", { id: "terminal-1", data });
        } catch (err) {
          console.error("Failed to write to terminal:", err);
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
      invoke("stop_terminal", { id: "terminal-1" }).catch(console.error);
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
