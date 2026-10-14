import { prisma } from "@/lib/prisma";
import { HubDocuments } from "@/components/HubDocuments";

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
            <HubDocuments documents={documents} />
          )}
        </article>

      </section>
    </>
  );
}
