import Link from "next/link";

export default function NotFound() {
  return (
    <section className="login-page">
      <article className="feed-card" style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ margin: "0 0 0.5rem" }}>Page introuvable</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Cette page n&apos;existe pas sur le portail VALUE-IT.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Retour à l&apos;accueil
        </Link>
      </article>
    </section>
  );
}
