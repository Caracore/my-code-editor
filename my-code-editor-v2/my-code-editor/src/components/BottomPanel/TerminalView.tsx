import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { useUserSettings } from "../../context/UserSettingsContext";
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
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const { settings } = useUserSettings();
  const { terminalFontSize, terminalCursorBlink, editorFontFamily } = settings;

  // Read xterm theme from current CSS variables. Called at mount and on
  // every `theme:applied` event so the terminal follows the active theme.
  const readThemeFromCss = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;
    return {
      background: v("--terminal-bg", "#181c23"),
      foreground: v("--terminal-fg", "#e6e8ee"),
      cursor: v("--terminal-cursor", "#5ad1ff"),
      cursorAccent: v("--terminal-cursor-accent", "#181c23"),
      selectionBackground: v("--terminal-selection-bg", "rgba(124,92,255,0.35)"),
      black: v("--terminal-black", "#1e232c"),
      red: v("--terminal-red", "#f25f5c"),
      green: v("--terminal-green", "#4ade80"),
      yellow: v("--terminal-yellow", "#f5b14c"),
      blue: v("--terminal-blue", "#82aaff"),
      magenta: v("--terminal-magenta", "#c792ea"),
      cyan: v("--terminal-cyan", "#5ad1ff"),
      white: v("--terminal-white", "#b6bcc8"),
      brightBlack: v("--terminal-bright-black", "#545b69"),
      brightRed: v("--terminal-bright-red", "#f07178"),
      brightGreen: v("--terminal-bright-green", "#c3e88d"),
      brightYellow: v("--terminal-bright-yellow", "#ffcb6b"),
      brightBlue: v("--terminal-bright-blue", "#7c5cff"),
      brightMagenta: v("--terminal-bright-magenta", "#c792ea"),
      brightCyan: v("--terminal-bright-cyan", "#89ddff"),
      brightWhite: v("--terminal-bright-white", "#e6e8ee"),
    };
  };

  // Hot-update visual settings without recreating the PTY session.
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.fontFamily = editorFontFamily;
    term.options.fontSize = terminalFontSize;
    term.options.cursorBlink = terminalCursorBlink;
    try {
      fitRef.current?.fit();
      invoke("terminal_resize", {
        id: sessionId,
        cols: term.cols,
        rows: term.rows,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [editorFontFamily, terminalFontSize, terminalCursorBlink, sessionId]);

  // Re-apply terminal theme whenever the global theme changes.
  useEffect(() => {
    const apply = () => {
      const term = termRef.current;
      if (!term) return;
      term.options.theme = readThemeFromCss();
    };
    window.addEventListener("theme:applied", apply);
    return () => window.removeEventListener("theme:applied", apply);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new Terminal({
      fontFamily: editorFontFamily,
      fontSize: terminalFontSize,
      lineHeight: 1.25,
      cursorBlink: terminalCursorBlink,
      cursorStyle: "bar",
      allowProposedApi: true,
      scrollback: 5000,
      theme: readThemeFromCss(),
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;

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
      termRef.current = null;
      fitRef.current = null;
      // Keep the shell process alive across remounts? -> no, tear it down.
      invoke("terminal_close", { id: sessionId }).catch(() => {});
    };
  }, [sessionId, cwd]);

  return <div ref={hostRef} className="terminal terminal--xterm" />;
}
