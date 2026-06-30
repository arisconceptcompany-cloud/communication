"use client";

import { useEffect, useState } from "react";
import type { UserPreferences } from "@/lib/preferences";

type Props = {
  initial: UserPreferences;
};

export function SettingsForm({ initial }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme ?? "light";
  }, [prefs.theme]);

  async function save(patch: UserPreferences) {
    setStatus("saving");
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setPrefs(data.preferences);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
    }
  }

  return (
    <article className="feed-card settings-card">
      <h2>Préférences d&apos;affichage</h2>
      <div className="settings-form">
        <label>
          Thème
          <select
            value={prefs.theme ?? "light"}
            onChange={(e) => {
              const theme = e.target.value as "light" | "dark";
              setPrefs((p) => ({ ...p, theme }));
              void save({ theme });
            }}
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </label>
        <label className="settings-check">
          <input
            type="checkbox"
            checked={prefs.emailNotifications ?? true}
            onChange={(e) => {
              const emailNotifications = e.target.checked;
              setPrefs((p) => ({ ...p, emailNotifications }));
              void save({ emailNotifications });
            }}
          />
          <span>Recevoir les alertes annonces RH par email (si SMTP configuré)</span>
        </label>
      </div>
      {status === "saved" && (
        <p className="alert alert-success">Préférences enregistrées.</p>
      )}
      {status === "error" && (
        <p className="alert alert-error">Erreur lors de l&apos;enregistrement.</p>
      )}
    </article>
  );
}
