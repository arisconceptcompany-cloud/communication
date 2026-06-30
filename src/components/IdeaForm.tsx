"use client";

import { useState } from "react";

export function IdeaForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const res = await fetch("/api/idees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        category: form.get("category"),
        body: form.get("body"),
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage(
        data.simulated
          ? "Idée enregistrée (mode démo — configurez SMTP pour l'envoi email)."
          : "Votre idée a été transmise anonymement aux destinataires désignés."
      );
      formEl.reset();
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
        <label htmlFor="category">Catégorie</label>
        <select id="category" name="category" required>
          <option value="process">Amélioration processus</option>
          <option value="outil">Outil / IT</option>
          <option value="qualite">Qualité & conformité</option>
          <option value="bienetre">Bien-être au travail</option>
          <option value="innovation">Innovation produit</option>
          <option value="autre">Autre</option>
        </select>
      </p>

      <p className="form-group">
        <label htmlFor="title">Titre de l&apos;idée</label>
        <input id="title" name="title" type="text" required maxLength={150} />
      </p>

      <p className="form-group">
        <label htmlFor="body">Description</label>
        <textarea
          id="body"
          name="body"
          required
          rows={10}
          placeholder="Décrivez votre idée, les bénéfices attendus et toute information utile…"
        />
      </p>

      <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Envoi…" : "Soumettre anonymement"}
      </button>
    </form>
  );
}
