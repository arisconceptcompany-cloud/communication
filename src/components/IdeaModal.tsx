"use client";

import { useState } from "react";
import { X, Lightbulb, Send, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

const CATEGORIES = [
  { value: "bienetre", label: "Vie de bureau" },
  { value: "outil", label: "Technique" },
  { value: "process", label: "Process" },
];

export function IdeaBoxWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  // ── Champs contrôlés (évite le problème FormData + Portal) ──
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("process");
  const [body, setBody] = useState("");

  function resetForm() {
    setTitle("");
    setCategory("process");
    setBody("");
    setStatus("idle");
    setMessage("");
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    let res: Response;
    try {
      res = await fetch("/api/idees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, body }),
      });
    } catch {
      setStatus("error");
      setMessage("Impossible de contacter le serveur. Vérifiez votre connexion.");
      return;
    }

    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      if (raw.trim()) data = JSON.parse(raw);
    } catch {
      console.error("Réponse non-JSON du serveur :", raw.slice(0, 300));
    }

    if (res.ok) {
      setStatus("ok");
      setMessage("Votre idée a été envoyée anonymement aux responsables.");
      setTitle("");
      setCategory("process");
      setBody("");
    } else {
      setStatus("error");
      setMessage(data.error || `Erreur serveur (${res.status})`);
      console.error(`[IdeaBox] POST /api/idees → ${res.status}`, raw.slice(0, 500));
    }
  }

  const modal = open
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="idea-modal-title"
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(11, 31, 58, 0.55)",
            backdropFilter: "blur(3px)", padding: "16px",
          }}
        >
          <article
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative", zIndex: 100000, background: "#ffffff",
              borderRadius: "16px", boxShadow: "0 24px 64px rgba(11,31,58,0.22)",
              width: "100%", maxWidth: "520px", overflow: "hidden",
            }}
          >
            {/* Header */}
            <header style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px", borderBottom: "1px solid #e2e8f0",
            }}>
              <h2 id="idea-modal-title" style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0b1f3a", display: "flex", alignItems: "center", gap: 8 }}>
                <Lightbulb size={18} style={{ color: "#f97316", flexShrink: 0 }} />
                Boîte à idées
              </h2>
              <button type="button" onClick={handleClose} aria-label="Fermer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: "50%", border: "none",
                  background: "#f1f5f9", cursor: "pointer", color: "#64748b",
                }}>
                <X size={16} />
              </button>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>
              <p style={{ margin: "0 0 16px" }}>
                <span className="badge badge-anon">100 % anonyme</span>
              </p>

              {status === "ok" && (
                <p className="alert alert-success" style={{ marginBottom: 16 }}>{message}</p>
              )}
              {status === "error" && (
                <p className="alert alert-error" style={{ marginBottom: 16 }}>{message}</p>
              )}

              <label className="form-group">
                Catégorie
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                Titre
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                  maxLength={150}
                  placeholder="Résumez votre idée en quelques mots…"
                />
              </label>

              <label className="form-group">
                Votre idée
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  minLength={10}
                  rows={5}
                  placeholder="Décrivez votre suggestion…"
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={handleClose}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === "loading" || title.trim().length < 3 || body.trim().length < 10}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {status === "loading"
                    ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                    : <><Send size={14} /> Envoyer</>}
                </button>
              </div>
            </form>
          </article>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <section className="feed-card fb-widget">
        <h3>Boîte à idées</h3>
        <p className="fb-widget-desc">Partagez une suggestion en toute confidentialité.</p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => { resetForm(); setOpen(true); }}
        >
          <Lightbulb size={16} />
          Déposer une idée anonyme
        </button>
      </section>
      {modal}
    </>
  );
}