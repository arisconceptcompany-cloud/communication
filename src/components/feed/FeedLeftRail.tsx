import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getTodayBirthdays } from "@/lib/birthdays";
import { prisma } from "@/lib/prisma";
import { IdeaBoxWidget } from "@/components/IdeaModal";
import { PostAvatar } from "./PostAvatar";
import { FolderOpen, Megaphone, Users, BarChart2, Cake } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "Ressources Humaines",
  EMPLOYEE: "Collaborateur",
};

export async function FeedLeftRail() {
  const session = await getSession();
  const [documents, birthdays] = await Promise.all([
    prisma.hubDocument.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      take: 5,
    }),
    getTodayBirthdays(),
  ]);

  return (
    <aside className="fb-left-rail">
      {session && (
        <section className="feed-card fb-profile-card">
          <PostAvatar name={session.name} size={52} />
          <div className="fb-profile-info">
            <strong>{session.name}</strong>
            <span>
              {session.department || ROLE_LABELS[session.role] || "Collaborateur"}
            </span>
          </div>
        </section>
      )}

      <section className="feed-card fb-widget">
        <h3>Raccourcis</h3>
        <nav className="fb-quick-links">
          <Link href="/hub">📂 Base documentaire</Link>
          <Link href="/annonces">📢 Annonces officielles</Link>
          <Link href="/rh">👥 Espace RH</Link>
          <Link href="/organigramme">📊 Organigramme</Link>
        </nav>
      </section>

      {documents.length > 0 && (
        <section className="feed-card fb-widget">
          <h3>Procédures & chartes</h3>
          <ul className="fb-doc-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target={doc.url.startsWith("http") ? "_blank" : undefined}
                    rel={doc.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {doc.title}
                  </a>
                ) : (
                  <Link href="/hub">{doc.title}</Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="feed-card fb-widget fb-birthdays">
        <h3>🎂 Anniversaires du jour</h3>
        {birthdays.length === 0 ? (
          <p className="fb-widget-desc">
            Aucun anniversaire aujourd&apos;hui.
          </p>
        ) : (
          <ul className="fb-doc-list">
            {birthdays.map((b) => (
              <li key={b.id}>
                <strong>{b.name}</strong>
                {b.department && (
                  <span className="fb-widget-desc"> — {b.department}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <IdeaBoxWidget />
    </aside>
  );
}
