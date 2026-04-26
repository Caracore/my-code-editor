import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";

interface Props {
  /** Stable id of this terminal session. Reusing the same id keeps the session alive. */
  sessionId: string;
  /** Initial working directory for the shell. */
  cwd?: string | null;
}

/**
 * A real PTY-backed terminal rendered with xterm.js.
 * Supports any shell command (cd, ls, git, npm, …) because input/output is
 * bridged to a real shell process via the `terminal_*` Tauri commands.
 */
export default function TerminalView({ sessionId, cwd }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontSize: 12.5,
      lineHeight: 1.25,
      cursorBlink: true,
      cursorStyle: "bar",
      allowProposedApi: true,
      scrollback: 5000,
      theme: {
        background: "#181c23",
        foreground: "#e6e8ee",
        cursor: "#5ad1ff",
        cursorAccent: "#181c23",
        selectionBackground: "rgba(124,92,255,0.35)",
        black: "#1e232c",
        red: "#f25f5c",
        green: "#4ade80",
        yellow: "#f5b14c",
        blue: "#82aaff",
        magenta: "#c792ea",
        cyan: "#5ad1ff",
        white: "#b6bcc8",
        brightBlack: "#545b69",
        brightRed: "#f07178",
        brightGreen: "#c3e88d",
        brightYellow: "#ffcb6b",
        brightBlue: "#7c5cff",
        brightMagenta: "#c792ea",
        brightCyan: "#89ddff",
        brightWhite: "#e6e8ee",
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);

    let unlistenData: UnlistenFn | null = null;
    let unlistenExit: UnlistenFn | null = null;
    let cancelled = false;

    const safeFit = () => {
      try {
        fit.fit();
      } catch {
        /* container not measurable yet */
      }
    };

    (async () => {
      // Subscribe BEFORE opening so we don't miss the initial banner.
      unlistenData = await listen<string>(
        `terminal://data/${sessionId}`,
        (e) => term.write(e.payload),
      );
      unlistenExit = await listen(
        `terminal://exit/${sessionId}`,
        () => term.write("\r\n\x1b[2m[process exited]\x1b[0m\r\n"),
      );

      if (cancelled) return;

      safeFit();
      try {
        await invoke("terminal_open", {
          id: sessionId,
          cwd: cwd ?? null,
          cols: term.cols,
          rows: term.rows,
        });
      } catch (err) {
        term.write(`\r\n\x1b[31mFailed to start terminal: ${String(err)}\x1b[0m\r\n`);
      }
    })();

    // User input → shell stdin
    const dataSub = term.onData((data) => {
      invoke("terminal_write", { id: sessionId, data }).catch(() => {});
    });

    // Resize handling
    const ro = new ResizeObserver(() => {
      safeFit();
      invoke("terminal_resize", {
        id: sessionId,
        cols: term.cols,
        rows: term.rows,
      }).catch(() => {});
    });
    ro.observe(host);

    // Focus on click
    const onClick = () => term.focus();
    host.addEventListener("click", onClick);

    return () => {
      cancelled = true;
      host.removeEventListener("click", onClick);
      ro.disconnect();
      dataSub.dispose();
      unlistenData?.();
      unlistenExit?.();
      term.dispose();
      // Keep the shell process alive across remounts? -> no, tear it down.
      invoke("terminal_close", { id: sessionId }).catch(() => {});
    };
  }, [sessionId, cwd]);

  return <div ref={hostRef} className="terminal terminal--xterm" />;
}
