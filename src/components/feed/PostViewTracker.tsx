"use client";

import { useEffect } from "react";

export function PostViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    void fetch(`/api/annonces/${postId}/view`, { method: "POST" });
  }, [postId]);

  return null;
}
