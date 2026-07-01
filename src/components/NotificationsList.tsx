"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, Lightbulb, MessageCircle, Trash2, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  announcement: Megaphone,
  idea: Lightbulb,
  chat: MessageCircle,
};

const TYPE_LABELS: Record<string, string> = {
  announcement: "Publication",
  idea: "Boîte à idées",
  chat: "Chat",
};

type Props = {
  initial: NotificationItem[];
};

async function api(path: string, body: unknown) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function NotificationsList({ initial }: Props) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const unreadCount = items.filter((n) => !n.read).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((n) => n.id)));
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((n) => !selected.has(n.id)));
      setSelected(new Set());
    }
  }

  async function deleteAll() {
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setItems([]);
      setSelected(new Set());
    }
  }

  async function markAllRead() {
    const res = await api("/api/notifications/read", { all: true });
    if (res.ok) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function markRead(id: string) {
    const res = await api("/api/notifications/read", { ids: [id] });
    if (res.ok) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="settings-page" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <header className="feed-page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div>
            <h1>Notifications</h1>
            <p>
              {unreadCount > 0
                ? `${unreadCount} non lue(s) sur ${items.length}`
                : items.length > 0
                  ? "Toutes les notifications sont lues"
                  : "Aucune notification"}
            </p>
          </div>
          {items.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {hasUnread && (
                <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                  <CheckCheck size={14} style={{ marginRight: 4 }} />
                  Tout marquer lu
                </button>
              )}
              {selected.size > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={deleteSelected}>
                  Supprimer ({selected.size})
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
                {selected.size === items.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={deleteAll}>
                Tout supprimer
              </button>
            </div>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <article className="feed-card feed-empty">
          <p>Aucune notification pour le moment.</p>
          <Link href="/">Retour à l&apos;accueil</Link>
        </article>
      ) : (
        <div className="feed-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {items.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Megaphone;
            const isSelected = selected.has(n.id);
            return (
              <article
                key={n.id}
                className="feed-card"
                style={{
                  opacity: n.read ? 0.65 : 1,
                  borderLeft: n.read ? "3px solid transparent" : "3px solid var(--orange)",
                  cursor: "default",
                  padding: "0.65rem 0.85rem",
                  background: isSelected ? "var(--orange-muted)" : undefined,
                }}
                onClick={() => toggle(n.id)}
              >
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "var(--orange-muted)",
                      color: "var(--orange)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                      {TYPE_LABELS[n.type] ?? n.type}
                      {!n.read && (
                        <span style={{ marginLeft: 8, fontSize: "0.65rem", background: "var(--orange)", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: 4 }}>Nouveau</span>
                      )}
                    </p>
                    <strong style={{ display: "block", marginTop: 2, fontSize: "0.9rem" }}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!n.read) markRead(n.id);
                          }}
                        >
                          {n.title}
                        </Link>
                      ) : (
                        n.title
                      )}
                    </strong>
                    {n.body && (
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>
                        {n.body}
                      </p>
                    )}
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {new Date(n.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetch("/api/notifications", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: [n.id] }),
                      }).then(() => {
                        setItems((prev) => prev.filter((i) => i.id !== n.id));
                        setSelected((prev) => { const s = new Set(prev); s.delete(n.id); return s; });
                      });
                    }}
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
