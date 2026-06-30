"use client";

import { useMessenger } from "./MessengerContext";
import { MessengerChat } from "./MessengerChat";

export function MessengerDock() {
  const { dockOpen, minimized, maximized, closeDock, setMinimized } = useMessenger();

  if (!dockOpen) return null;

  if (minimized) {
    return (
      <button
        type="button"
        className="messenger-dock-minimized"
        onClick={() => setMinimized(false)}
      >
        💬 Salon VALUE-IT
      </button>
    );
  }

  return (
    <div className={`messenger-dock${maximized ? " messenger-dock--maximized" : ""}`}>
      <MessengerChat
        variant="window"
        onClose={closeDock}
        onMinimize={() => setMinimized(true)}
      />
    </div>
  );
}
