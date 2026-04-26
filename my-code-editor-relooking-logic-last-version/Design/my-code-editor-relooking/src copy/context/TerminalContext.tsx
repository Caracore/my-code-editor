import React, { createContext, useContext, useRef } from "react";
import { TerminalManager } from "../managers/TerminalManager";

const TerminalContext = createContext<TerminalManager | null>(null);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const managerRef = useRef(new TerminalManager());

  return (
    <TerminalContext.Provider value={managerRef.current}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminalManager() {
  const ctx = useContext(TerminalContext);
  if (!ctx)
    throw new Error("useTerminalManager must be used inside TerminalProvider");
  return ctx;
}
