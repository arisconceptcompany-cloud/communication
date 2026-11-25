"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time-ago";

/**
 * Rendu client-only : le serveur et le navigateur ne calculent pas le même
 * « il y a … » (horloge et locale différentes), ce qui provoquait une erreur
 * d'hydratation React #418.
 */
export function TimeAgo({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const refresh = () => setLabel(timeAgo(iso));
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [iso]);

  return (
    <time className={className} dateTime={iso} suppressHydrationWarning>
      {label}
    </time>
  );
}
