import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getFeedPosts } from "@/lib/feed";
import { redirect } from "next/navigation";
import { TypologyBadge } from "@/components/feed/TypologyBadge";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const posts = await getFeedPosts(session);
  const alerts = posts.filter((p) => p.pinned || p.category === "urgent");

  return (
    <div className="settings-page">
      <header className="feed-page-header">
        <h1>Alertes RH</h1>
        <p>Annonces épinglées et communications prioritaires.</p>
      </header>

      {alerts.length === 0 ? (
        <article className="feed-card feed-empty">
          <p>Aucune alerte active pour le moment.</p>
          <Link href="/annonces">Voir toutes les annonces</Link>
        </article>
      ) : (
        <div className="feed-list">
          {alerts.map((post) => (
            <article key={post.id} className="feed-card">
              <p className="announcement-meta">
                {post.author.name} ·{" "}
                {new Date(post.createdAt).toLocaleString("fr-FR")} ·{" "}
                <TypologyBadge category={post.category} />
                {post.pinned && " · 📌 Épinglé"}
              </p>
              <h2 style={{ margin: "0.5rem 0" }}>{post.title}</h2>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{post.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
