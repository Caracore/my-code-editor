import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

// Available modes
export type EditorMode = "normal" | "insert" | "hint";

interface ModeContextType {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  enterNormalMode: () => void;
  enterInsertMode: () => void;
  enterHintMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<EditorMode>("normal");
  const modeRef = useRef(mode);
  
  // Keep ref in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const setMode = useCallback((newMode: EditorMode) => {
    console.log(`🎯 Mode: ${modeRef.current} → ${newMode}`);
    setModeState(newMode);
  }, []);

  const enterNormalMode = useCallback(() => setMode("normal"), [setMode]);
  const enterInsertMode = useCallback(() => setMode("insert"), [setMode]);
  const enterHintMode = useCallback(() => setMode("hint"), [setMode]);

  // Global escape handler for returning to normal mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape always returns to normal mode (except from normal)
      if (e.key === "Escape" && modeRef.current !== "normal") {
        e.preventDefault();
        e.stopPropagation();
        setMode("normal");
        
        // Blur any focused element when entering normal mode
        if (document.activeElement instanceof HTMLElement) {
          // Don't blur if it's the body
          if (document.activeElement !== document.body) {
            document.activeElement.blur();
          }
        }
        return;
      }

      // In normal mode, 'i' enters insert mode
      if (modeRef.current === "normal" && e.key === "i" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setMode("insert");
        
        // Focus the editor if available
        const editor = document.querySelector(".cm-editor .cm-content") as HTMLElement;
        if (editor) {
          editor.focus();
        }
        return;
      }

      // In normal mode, 'f' enters hint mode (handled by useGlobalJumpLabels)
      // We just need to NOT block it here
    };

    // Use capture to get events before other handlers
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [setMode]);

  // Auto-detect insert mode when editor is focused
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // If focusing into CodeMirror editor, enter insert mode
      if (target.closest(".cm-editor") && modeRef.current === "normal") {
        setMode("insert");
      }
      
      // If focusing into input/textarea, enter insert mode
      if ((target.tagName === "INPUT" || target.tagName === "TEXTAREA") && modeRef.current === "normal") {
        setMode("insert");
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      
      // If leaving editor and not going to another input, return to normal
      if (modeRef.current === "insert") {
        const isGoingToInput = relatedTarget && (
          relatedTarget.closest(".cm-editor") ||
          relatedTarget.tagName === "INPUT" ||
          relatedTarget.tagName === "TEXTAREA"
        );
        
        if (!isGoingToInput) {
          // Small delay to avoid flicker
          setTimeout(() => {
            if (modeRef.current === "insert") {
              setMode("normal");
            }
          }, 100);
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [setMode]);

  return (
    <ModeContext.Provider value={{ mode, setMode, enterNormalMode, enterInsertMode, enterHintMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within ModeProvider");
  }
  return context;
}
