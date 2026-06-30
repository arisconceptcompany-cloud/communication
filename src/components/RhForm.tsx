"use client";

import { useState } from "react";

export function RhForm({ userName }: { userName: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const res = await fetch("/api/rh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: form.get("subject"),
        category: form.get("category"),
        priority: form.get("priority"),
        body: form.get("body"),
        attachments: form.get("attachments"),
      }),
    });

    if (res.ok) {
      setStatus("ok");
      setMessage("Votre message a été transmis aux Ressources Humaines.");
      formEl.reset();
    } else {
      const data = await res.json();
      setStatus("error");
      setMessage(data.error || "Erreur lors de l'envoi");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {status === "ok" && <p className="alert alert-success">{message}</p>}
      {status === "error" && <p className="alert alert-error">{message}</p>}

      <p className="form-group">
        <label>Expéditeur</label>
        <input type="text" value={userName} disabled />
      </p>

      <section className="grid-2">
        <p className="form-group">
          <label htmlFor="category">Catégorie</label>
          <select id="category" name="category" required>
            <option value="">— Choisir —</option>
            <option value="conge">Congés & absences</option>
            <option value="paie">Paie & avantages</option>
            <option value="formation">Formation</option>
            <option value="discipline">Discipline / éthique</option>
            <option value="mobilite">Mobilité interne</option>
            <option value="sante">Santé au travail</option>
            <option value="autre">Autre demande RH</option>
          </select>
        </p>
        <p className="form-group">
          <label htmlFor="priority">Priorité</label>
          <select id="priority" name="priority" required>
            <option value="normale">Normale</option>
            <option value="urgente">Urgente</option>
            <option value="confidentielle">Confidentielle</option>
          </select>
        </p>
      </section>

      <p className="form-group">
        <label htmlFor="subject">Objet</label>
        <input id="subject" name="subject" type="text" required maxLength={200} />
      </p>

      <p className="form-group">
        <label htmlFor="body">Message détaillé</label>
        <textarea
          id="body"
          name="body"
          required
          rows={16}
          placeholder="Décrivez votre demande ou communication RH en détail : contexte, dates, personnes concernées, pièces jointes mentionnées…"
          style={{ minHeight: "320px" }}
        />
      </p>

      <p className="form-group">
        <label htmlFor="attachments">Pièces jointes (références)</label>
        <textarea
          id="attachments"
          name="attachments"
          rows={3}
          placeholder="Listez les noms de fichiers à joindre par email séparé, ou liens SharePoint internes"
        />
      </p>

      <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Envoi en cours…" : "Envoyer aux RH"}
      </button>
    </form>
  );
}
