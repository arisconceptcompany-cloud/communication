"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Megaphone, Lightbulb, MessageCircle, X } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  createdAt: string;
};

const ICONS: Record<string, React.ElementType> = {
  announcement: Megaphone,
  idea: Lightbulb,
  chat: MessageCircle,
};

export function NotificationToast() {
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(0);
  const knownIds = useRef(new Set<string>());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const items: NotificationItem[] = data.notifications ?? [];

      setCount(items.length);

      const newItems = items.filter((n) => !knownIds.current.has(n.id));
      for (const item of items) {
        knownIds.current.add(item.id);
      }

      if (newItems.length > 0) {
        setToasts((prev) => {
          const updated = [...newItems.slice(0, 3), ...prev].slice(0, 5);
          return updated;
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function markRead(id: string) {
    const payload = JSON.stringify({ ids: [id] });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/notifications/read",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch(() => {});
  }

  async function dismissAll() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setToasts([]);
    setCount(0);
  }

  return (
    <>
      <div className="toast-stack">
        {toasts.slice(0, 3).map((toast) => {
          const Icon = ICONS[toast.type] ?? Megaphone;
          return (
            <div key={toast.id} className="toast-item">
              <a
                href={toast.link ?? "#"}
                className="toast-content"
                onClick={() => {
                  markRead(toast.id);
                  removeToast(toast.id);
                }}
              >
                <span className="toast-icon">
                  <Icon size={18} />
                </span>
                <span className="toast-text">
                  <strong>{toast.title}</strong>
                  {toast.body && <span>{toast.body}</span>}
                </span>
              </a>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        className="toast-mark-all-read"
        onClick={dismissAll}
        aria-label="Marquer tout comme lu"
        title="Marquer tout lu"
      >
        <X size={14} />
      </button>
    </>
  );
}

export function getNotificationCount() {
  return typeof window !== "undefined"
    ? fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => d.count ?? 0)
        .catch(() => 0)
    : Promise.resolve(0);
}
