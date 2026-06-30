"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { RhForm } from "@/components/RhForm";
import { RhInbox } from "@/components/RhInbox";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/client-auth";
import { Trash2, Clock, Lightbulb, AlertTriangle } from "lucide-react";

export default function RhPage() {
  const { session, loading } = useSession();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [deleteIdeaId, setDeleteIdeaId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const isRh = session?.role === "RH" || session?.role === "ADMIN";

  useEffect(() => {
    if (!session || loading) return;

    const fetchData = async () => {
      const results = await Promise.all([
        isRh
          ? fetch("/api/rh?type=submissions").then((res) => res.json() as any)
          : Promise.resolve([]),
        isRh
          ? fetch("/api/rh?type=ideas").then((res) => res.json() as any)
          : Promise.resolve([]),
        fetch("/api/hub?category=paie,mutuelle,planning,document").then((res) => res.json() as any),
        isRh
          ? fetch("/api/rh?type=stats").then((res) => res.json() as any)
          : Promise.resolve(null),
      ]);

      setSubmissions(results[0]);
      setIdeas(results[1]);
      setFolders(results[2]);
      setStats(results[3]);
    };

    fetchData();
  }, [session, loading, isRh]);

  if (loading) {
    return <div className="rh-page">Loading...</div>;
  }

  if (!session) redirect("/login");

  async function handleDeleteIdea(id: string) {
    setIsDeleting(true);
    setDeleteSuccess(null);

    try {
      const response = await fetch(`/api/idees/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDeleteSuccess(data.message);
          setIdeas((prev) => prev.filter((idea) => idea.id !== id));
        } else {
          console.error("Failed to delete idea:", data.error);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to delete idea:", errorData.error);
      }
    } catch (error) {
      console.error("Error deleting idea:", error);
    } finally {
      setIsDeleting(false);
      setDeleteIdeaId(null);
      setTimeout(() => setDeleteSuccess(null), 3000);
    }
  }

  const confirmDelete = (id: string) => {
    setDeleteIdeaId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteIdeaId) {
      await handleDeleteIdea(deleteIdeaId);
    }
  };

  return (
    <div className="rh-page">
      <header className="rh-banner">
        <div className="rh-banner-content">
          <h1>Espace Ressources Humaines</h1>
          <p>Documents officiels, demandes collaborateurs et communication RH.</p>
        </div>
      </header>

      {isRh && stats && (
        <section className="rh-stats-grid">
          <article className="feed-card rh-stat-card">
            <strong>{stats.totalPosts}</strong>
            <span>Annonces publiées</span>
          </article>
          <article className="feed-card rh-stat-card">
            <strong>{stats.totalReactions}</strong>
            <span>Réactions collaborateurs</span>
          </article>
          <article className="feed-card rh-stat-card">
            <strong>{stats.pinnedPosts}</strong>
            <span>Annonces épinglées</span>
          </article>
<article className="feed-card rh-stat-card">
  <strong>{stats.newSubmissions}</strong>
  <span>Demandes nouvelles</span>
</article>
<article className="feed-card rh-stat-card">
  <strong>{stats.ideaCount}</strong>
  <span>Idées anonymes recue</span>
</article>
        </section>
      )}

      <section className="rh-content-grid">
        <article className="feed-card">
          <h2>Grand formulaire de communication</h2>
          <p className="fb-widget-desc">
            Transmettez vos demandes et dossiers aux équipes RH.
          </p>
          <RhForm userName={session.name} />
        </article>

        <article className="feed-card">
          <h2>Documents &amp; dossiers</h2>
          {folders.length === 0 ? (
            <p className="fb-widget-desc">
              Aucun document — consultez le{" "}
              <Link href="/hub">hub interne</Link>.
            </p>
          ) : (
            <ul className="rh-folder-list">
              {(folders as any[]).map((doc: any) => (
                <li key={doc.id}>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target={doc.url.startsWith("http") ? "_blank" : undefined}
                      rel={
                        doc.url.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {doc.title}
                    </a>
                  ) : (
                    <span>{doc.title}</span>
                  )}
                  {doc.description && (
                    <small className="fb-widget-desc">{doc.description}</small>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isRh && (
            <Link
              href="/annonces"
              className="btn btn-secondary text-white"
              style={{ marginTop: "1rem" }}
            >
              Publier une annonce officielle
            </Link>
          )}
        </article>
      </section>

      {isRh && submissions.length > 0 && (
        <article className="feed-card" style={{ marginTop: "1rem" }}>
          <h2>{"Boite de réception RH"}</h2>
          <RhInbox
            submissions={(submissions as any[]).map((s: any) => ({
              ...s,
              createdAt: new Date(s.createdAt).toISOString(),
            }))}
          />
        </article>
      )}

      {isRh && ideas.length > 0 && (
        <article className="feed-card rh-ideas-section">
          <div className="rh-ideas-header">
            <h2><Lightbulb size={18} style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6, color: "var(--orange)" }} /> Idées anonymes reçues</h2>
            <span className="rh-ideas-count">{ideas.length} idée{ideas.length > 1 ? "s" : ""}</span>
          </div>
          {deleteSuccess && (
            <div className="alert alert-success" style={{ margin: "0 1.15rem 1rem" }}>
              {deleteSuccess}
            </div>
          )}
          {(ideas as any[]).map((idea: any) => (
            <div key={idea.id} className="rh-idea-card">
              <div className="rh-idea-card-top">
                <div className="rh-idea-card-body">
                  <h3 className="rh-idea-card-title">{idea.title}</h3>
                  <div className="rh-idea-card-meta">
                    <span className="rh-idea-category">{idea.category}</span>
                    <span className="rh-idea-date">
                      <Clock size={12} className="icon-inline" />
                      {new Date(idea.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="rh-idea-text">{idea.body}</p>
                </div>
                <button
                  onClick={() => confirmDelete(idea.id)}
                  disabled={isDeleting}
                  className="rh-idea-delete-btn"
                  title="Supprimer cette idée"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </article>
      )}

      {deleteIdeaId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3><AlertTriangle size={18} style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6, color: "#b91c1c" }} /> Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette idée ? Cette action est irréversible.</p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteIdeaId(null)}
                disabled={isDeleting}
                className="btn btn-ghost"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "0.5rem 1.15rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "inherit",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}