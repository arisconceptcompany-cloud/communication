"use client";

import { useState } from "react";

export function IdeaForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("process");
  const [body, setBody] = useState("");

  const titleOk = title.trim().length >= 3;
  const bodyOk = body.trim().length >= 10;
  const canSubmit = titleOk && bodyOk;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/idees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, body }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage(
        data.simulated
          ? "Idée enregistrée (mode démo — configurez SMTP pour l'envoi email)."
          : "Votre idée a été transmise anonymement aux destinataires désignés."
      );
      setTitle("");
      setCategory("process");
      setBody("");
    } else {
      setStatus("error");
      setMessage(data.error || "Erreur");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ marginBottom: "1rem" }}>
        <span className="badge badge-anon">100 % anonyme</span> — aucune
        authentification requise. Les idées sont envoyées aux adresses configurées
        par l&apos;administrateur.
      </p>
      {status === "ok" && <p className="alert alert-success">{message}</p>}
      {status === "error" && <p className="alert alert-error">{message}</p>}

      <p className="form-group">
        <label htmlFor="idea-category">Catégorie</label>
        <select id="idea-category" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="process">Amélioration processus</option>
          <option value="outil">Outil / IT</option>
          <option value="qualite">Qualité & conformité</option>
          <option value="bienetre">Bien-être au travail</option>
          <option value="innovation">Innovation produit</option>
          <option value="autre">Autre</option>
        </select>
      </p>

      <p className="form-group">
        <label htmlFor="idea-title">Titre de l&apos;idée</label>
        <input
          id="idea-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={150}
          placeholder="Résumez votre idée en quelques mots…"
        />
        <small style={{ color: titleOk ? "var(--text-muted)" : "var(--orange)", opacity: title.length === 0 ? 0.5 : 1 }}>
          {title.length}/3 caractères minimum
        </small>
      </p>

      <p className="form-group">
        <label htmlFor="idea-body">Description</label>
        <textarea
          id="idea-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={10}
          placeholder="Décrivez votre idée, les bénéfices attendus et toute information utile…"
        />
        <small style={{ color: bodyOk ? "var(--text-muted)" : "var(--orange)", opacity: body.length === 0 ? 0.5 : 1 }}>
          {body.length}/10 caractères minimum
        </small>
      </p>

      <button type="submit" className="btn btn-primary" disabled={status === "loading" || !canSubmit}>
        {status === "loading" ? "Envoi…" : "Soumettre anonymement"}
      </button>
    </form>
  );
}
