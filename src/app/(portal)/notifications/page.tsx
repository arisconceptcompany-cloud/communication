import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Megaphone, Lightbulb, MessageCircle } from "lucide-react";

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

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: {
      NOT: { creatorId: session.id },
      OR: [
        { userId: session.id },
        { userId: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="settings-page" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <header className="feed-page-header">
        <h1>Notifications</h1>
        <p>
          {unreadCount > 0
            ? `${unreadCount} notification(s) non lue(s)`
            : "Toutes les notifications sont lues"}
        </p>
      </header>

      {notifications.length === 0 ? (
        <article className="feed-card feed-empty">
          <p>Aucune notification pour le moment.</p>
          <Link href="/">Retour à l&apos;accueil</Link>
        </article>
      ) : (
        <div className="feed-list">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Megaphone;
            return (
              <article
                key={n.id}
                className={`feed-card ${!n.read ? "" : ""}`}
                style={{
                  opacity: n.read ? 0.65 : 1,
                  borderLeft: n.read ? "3px solid transparent" : "3px solid var(--orange)",
                }}
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
                      {n.link ? <Link href={n.link}>{n.title}</Link> : n.title}
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
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
