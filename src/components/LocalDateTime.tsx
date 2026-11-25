"use client";

import { useEffect, useState } from "react";

/**
 * Dates formatées côté navigateur uniquement : l'ICU de Node et celui du
 * navigateur peuvent produire des chaînes différentes et casser l'hydratation.
 */
function useLocalLabel(iso: string, format: () => string) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(format());
  }, [iso]); // eslint-disable-line react-hooks/exhaustive-deps
  return label;
}

export function LocalDateTime({ iso }: { iso: string }) {
  const label = useLocalLabel(iso, () =>
    new Date(iso).toLocaleString("fr-FR")
  );
  return <span suppressHydrationWarning>{label}</span>;
}

export function LocalTime({ iso }: { iso: string }) {
  const label = useLocalLabel(iso, () =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
  return <span suppressHydrationWarning>{label}</span>;
}

export function LocalDayLabel({ iso }: { iso: string }) {
  const label = useLocalLabel(iso, () =>
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  );
  return <span suppressHydrationWarning>{label}</span>;
}
