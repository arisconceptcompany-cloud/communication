"use client";

import { MessageCircle } from "lucide-react";
import { MessengerProvider, useMessenger } from "./MessengerContext";
import { MessengerDock } from "./MessengerDock";

function MessengerFloatingBtn() {
  const { dockOpen, toggleDock } = useMessenger();

  if (dockOpen) return null;

  return (
    <button
      type="button"
      className="messenger-floating-btn"
      onClick={toggleDock}
      title="Ouvrir Messenger"
      aria-label="Messenger VALUE-IT"
    >
      <MessageCircle size={22} />
    </button>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <MessengerProvider>
      {children}
      <MessengerFloatingBtn />
      <MessengerDock />
    </MessengerProvider>
  );
}
