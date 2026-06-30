"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type MessengerContextValue = {
  dockOpen: boolean;
  minimized: boolean;
  maximized: boolean;
  openDock: () => void;
  closeDock: () => void;
  toggleDock: () => void;
  setMinimized: (v: boolean) => void;
  toggleMaximized: () => void;
};

const MessengerContext = createContext<MessengerContextValue | null>(null);

export function MessengerProvider({ children }: { children: React.ReactNode }) {
  const [dockOpen, setDockOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const openDock = useCallback(() => {
    setDockOpen(true);
    setMinimized(false);
  }, []);

  const closeDock = useCallback(() => {
    setDockOpen(false);
    setMinimized(false);
    setMaximized(false);
  }, []);

  const toggleMaximized = useCallback(() => {
    setMaximized((v) => !v);
  }, []);

  const toggleDock = useCallback(() => {
    setDockOpen((v) => {
      if (v) { setMinimized(false); setMaximized(false); }
      return !v;
    });
  }, []);

  const value = useMemo(
    () => ({
      dockOpen,
      minimized,
      maximized,
      openDock,
      closeDock,
      toggleDock,
      setMinimized,
      toggleMaximized,
    }),
    [dockOpen, minimized, maximized, openDock, closeDock, toggleDock, toggleMaximized]
  );

  return (
    <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>
  );
}

export function useMessenger() {
  const ctx = useContext(MessengerContext);
  if (!ctx) {
    throw new Error("useMessenger must be used within MessengerProvider");
  }
  return ctx;
}
