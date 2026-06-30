"use client";

import { useEffect } from "react";

type Props = {
  theme?: "light" | "dark";
};

export function ThemeInit({ theme = "light" }: Props) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
