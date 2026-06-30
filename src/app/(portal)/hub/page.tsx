import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HubPage() {
  const documents = await prisma.hubDocument.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return (
    <>
      <header className="feed-page-header">
        <h1>Hub interne</h1>
        <p>
          Base documentaire et salon collaboratif VALUE-IT. Le chat est accessible
          sans authentification.
        </p>
      </header>

      <section className="hub-grid">
        <article className="feed-card">
          <h2 style={{ marginTop: 0, color: "var(--navy)" }}>📂 Ressources</h2>
          {documents.length === 0 ? (
            <p className="fb-widget-desc">
              Aucune ressource publiée pour le moment. Les équipes RH et IT
              peuvent ajouter des documents via la base de données ou le seed.
            </p>
          ) : (
          <ul className="hub-doc-list">
            {documents.map((doc) => (
              <li key={doc.id} className="hub-doc-item">
                {doc.url ? (
                  <a
                    href={doc.url}
                    target={doc.url.startsWith("http") ? "_blank" : undefined}
                    rel={doc.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    <strong>{doc.title}</strong>
                  </a>
                ) : (
                  <strong>{doc.title}</strong>
                )}
                {doc.description && (
                  <p className="fb-widget-desc">{doc.description}</p>
                )}
                <span className="badge">{doc.category}</span>
              </li>
            ))}
          </ul>
          )}
        </article>

      </section>
    </>
  );
}
