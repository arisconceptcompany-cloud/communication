"use client";

import { useState, useEffect } from "react";
import type { SessionUser } from "./types";

export function useSession() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const refreshSession = async () => {
    setLoading(true);
    await fetchSession();
  };

  return { session, loading, refreshSession };
}

async function fetchSession() {
  const response = await fetch("/api/auth/session");
  if (response.ok) {
    return await response.json();
  }
  return { session: null };
}
