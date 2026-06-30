import { LoginForm } from "@/components/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  return (
    <section className="login-page">
      <article className="card login-card">
        <section className="logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-valueit.svg"
            alt="VALUE-IT"
            width={240}
            height={64}
          />
        </section>
        <h1 style={{ textAlign: "center", margin: "0 0 0.5rem", fontSize: "1.35rem" }}>
          Portail intranet
        </h1>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Accès réservé aux collaborateurs Value-IT
        </p>
        <LoginForm searchParams={searchParams} />
      </article>
    </section>
  );
}
