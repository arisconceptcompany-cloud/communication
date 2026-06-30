"use client";

import Link from "next/link";
import { useMessenger } from "@/components/messenger/MessengerContext";
import { MessageCircle, Maximize2 } from "lucide-react";

export function TopBarMessenger() {
  const { toggleDock, dockOpen } = useMessenger();

  return (
    <>
      <button
        type="button"
        className={`top-bar-messenger ${dockOpen ? "active" : ""}`}
        onClick={toggleDock}
        title="Ouvrir Messenger"
        aria-label="Messenger VALUE-IT"
      >
        <MessageCircle size={20} aria-hidden />
      </button>

    </>
  );
}