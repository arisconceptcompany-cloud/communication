"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Settings2, Palette, Bell } from "lucide-react";
import type { UserPreferences } from "@/lib/preferences";
import type { SessionUser } from "@/lib/auth";

type Props = {
  initial: UserPreferences;
  user: SessionUser;
};

function PasswordField({
  label,
  value,
  onChange,
  minLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="settings-pw-field">
      <span>{label}</span>
      <span className="settings-pw-wrapper">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="settings-pw-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer" : "Afficher"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="settings-section-header">
      <span className="settings-section-icon">
        <Icon size={20} />
      </span>
      <span className="settings-section-title">{title}</span>
      {badge && <span className="settings-section-badge">{badge}</span>}
    </div>
  );
}

export function SettingsForm({ initial, user }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({});
  const [adminSettingKey, setAdminSettingKey] = useState("");
  const [adminSettingValue, setAdminSettingValue] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const isRhOrAdmin = user.role === "RH" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme ?? "light";
  }, [prefs.theme]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .then((data) => setAdminSettings(data.settings ?? {}))
        .catch(() => {});
    }
  }, [isAdmin]);

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      setPwError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPwStatus("saving");
    setPwError("");
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    });
    if (res.ok) {
      setPwStatus("saved");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setTimeout(() => setPwStatus("idle"), 3000);
    } else {
      const data = await res.json();
      setPwError(data.error ?? "Erreur lors du changement de mot de passe.");
      setPwStatus("error");
    }
  }

  async function handleAdminSettingSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminSettingKey.trim()) return;
    setAdminStatus("saving");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: adminSettingKey.trim(), value: adminSettingValue }),
    });
    if (res.ok) {
      setAdminSettings((prev) => ({ ...prev, [adminSettingKey.trim()]: adminSettingValue }));
      setAdminStatus("saved");
      setAdminSettingKey("");
      setAdminSettingValue("");
      setEditingKey(null);
      setTimeout(() => setAdminStatus("idle"), 3000);
    } else {
      setAdminStatus("error");
    }
  }

  function startEdit(key: string, value: string) {
    setEditingKey(key);
    setAdminSettingKey(key);
    setAdminSettingValue(value);
  }

  function cancelEdit() {
    setEditingKey(null);
    setAdminSettingKey("");
    setAdminSettingValue("");
  }

  return (
    <>
      <article className="feed-card settings-card settings-left">
        <SectionHeader icon={Palette} title="Préférences d&apos;affichage" />
        <div className="settings-form">
          <label>
            <span>Thème</span>
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
            <span>
              <Bell size={16} className="settings-check-icon" />
              Recevoir les alertes RH par email
            </span>
          </label>
        </div>
        {status === "saved" && (
          <p className="alert alert-success">Préférences enregistrées.</p>
        )}
        {status === "error" && (
          <p className="alert alert-error">Erreur lors de l&apos;enregistrement.</p>
        )}
      </article>

      {isRhOrAdmin && (
        <article className="feed-card settings-card settings-right">
          <SectionHeader icon={KeyRound} title="Sécurité" badge="RH · Admin" />
          <form className="settings-form" onSubmit={handlePasswordChange}>
            <div className="settings-form-grid">
              <PasswordField
                label="Mot de passe actuel"
                value={pwCurrent}
                onChange={setPwCurrent}
                minLength={1}
                placeholder="Saisissez votre mot de passe actuel"
              />
              <div>
                <PasswordField
                  label="Nouveau mot de passe"
                  value={pwNew}
                  onChange={setPwNew}
                  minLength={8}
                  placeholder="8 caractères minimum"
                />
                <div style={{ height: "0.85rem" }} />
                <PasswordField
                  label="Confirmer le nouveau mot de passe"
                  value={pwConfirm}
                  onChange={setPwConfirm}
                  minLength={8}
                  placeholder="Ressaisissez le nouveau mot de passe"
                />
              </div>
            </div>
            <div className="settings-form-actions">
              <button type="submit" className="btn btn-primary" disabled={pwStatus === "saving"}>
                {pwStatus === "saving" ? "Enregistrement…" : "Changer le mot de passe"}
              </button>
            </div>
            {pwStatus === "saved" && (
              <p className="alert alert-success">Mot de passe mis à jour.</p>
            )}
            {pwError && (
              <p className="alert alert-error">{pwError}</p>
            )}
          </form>
        </article>
      )}

      {isAdmin && (
        <article className="feed-card settings-card settings-card--admin settings-full">
          <SectionHeader icon={Settings2} title="Configuration applicative" badge="Administrateur" />
          <div className="settings-admin-list">
            {Object.entries(adminSettings).length === 0 ? (
              <p className="settings-empty">Aucun paramètre configuré.</p>
            ) : (
              Object.entries(adminSettings).map(([key, value]) => (
                <div key={key} className="settings-admin-row">
                  {editingKey === key ? (
                    <div className="settings-admin-edit">
                      <input
                        type="text"
                        value={adminSettingValue}
                        onChange={(e) => setAdminSettingValue(e.target.value)}
                        className="settings-admin-edit-input"
                        autoFocus
                      />
                      <div className="settings-admin-edit-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleAdminSettingSave}
                          disabled={adminStatus === "saving"}
                        >
                          {adminStatus === "saving" ? "…" : "Sauvegarder"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={cancelEdit}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="settings-admin-key">{key}</span>
                      <span className="settings-admin-value">{value}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(key, value)}
                      >
                        Modifier
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          <hr className="settings-divider" />
          <form className="settings-form" onSubmit={handleAdminSettingSave}>
            <label>
              Nouveau paramètre
              <div className="settings-admin-add">
                <input
                  type="text"
                  value={adminSettingKey}
                  onChange={(e) => setAdminSettingKey(e.target.value)}
                  placeholder="Clé (ex: IDEA_BOX_RECIPIENTS)"
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={adminStatus === "saving"}>
                  Ajouter
                </button>
              </div>
            </label>
            {adminStatus === "saved" && (
              <p className="alert alert-success">Paramètre enregistré.</p>
            )}
            {adminStatus === "error" && (
              <p className="alert alert-error">Erreur lors de l&apos;enregistrement.</p>
            )}
          </form>
        </article>
      )}
    </>
  );
}
