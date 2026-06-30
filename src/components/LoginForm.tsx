"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const [error, setError] = useState(params.error || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erreur de connexion");
      return;
    }

    router.push(params.redirect || "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="alert alert-error">{error}</p>}

      <p className="form-group">
        <label htmlFor="email">Email professionnel</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="prenom.nom@value-it.mg"
          autoComplete="username"
        />
      </p>

      <p className="form-group">
        <label htmlFor="password">Mot de passe</label>
        <span style={{ position: "relative", display: "block" }}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            style={{ paddingRight: "2.5rem", width: "100%", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            style={{
              position: "absolute",
              right: "0.6rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </p>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={loading}
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
        Hub interne et boîte à idées :{" "}
        <a href="/hub">accès sans connexion</a>
      </p>
    </form>
  );
}