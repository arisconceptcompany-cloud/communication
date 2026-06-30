"use client";

import { MessengerChat } from "@/components/messenger/MessengerChat";

type Props = {
  showModeration?: boolean;
};

export function MessengerPanel({ showModeration = false }: Props) {
  return (
    <aside className="fb-messenger-panel feed-card">
      <MessengerChat variant="sidebar" showModeration={showModeration} />
    </aside>
  );
}
