"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Submission = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  body: string;
  attachments: string | null;
  status: string;
  createdAt: string;
  submitter: { name: string; email: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
  archive: "Archivé",
};

export function RhInbox({ submissions }: { submissions: Submission[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    await fetch(`/api/rh/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  if (submissions.length === 0) {
    return (
      <p className="fb-widget-desc">Aucune soumission pour le moment.</p>
    );
  }

  return (
    <div className="rh-inbox">
      {submissions.map((s) => (
        <section key={s.id} className="announcement-item">
          <div className="rh-inbox-header">
            <h3>{s.subject}</h3>
            <select
              value={s.status}
              disabled={busy === s.id}
              onChange={(e) => updateStatus(s.id, e.target.value)}
              aria-label="Statut de la demande"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <p className="announcement-meta">
            {s.submitter?.name || "Anonyme"} · {s.category} · {s.priority} ·{" "}
            {new Date(s.createdAt).toLocaleString("fr-FR")}
          </p>
          {s.attachments && (
            <p className="rh-inbox-attachments">
              <strong>Pièces jointes :</strong> {s.attachments}
            </p>
          )}
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{s.body}</p>
        </section>
      ))}
    </div>
  );
}
