"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BirthdayRecord,
  formatBirthDate,
  type BirthdayInput,
} from "@/lib/anniversaires";

const EMPTY_FORM: BirthdayInput = {
  matricule: "",
  fullName: "",
  birthDate: "",
};

export function BirthdayManager() {
  const [records, setRecords] = useState<BirthdayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BirthdayRecord | null>(null);
  const [form, setForm] = useState<BirthdayInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BirthdayRecord | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/anniversaires", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Impossible de charger la liste");
      }
      setRecords((await res.json()) as BirthdayRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter(
      (r) =>
        r.matricule.toLowerCase().includes(needle) ||
        r.fullName.toLowerCase().includes(needle)
    );
  }, [records, query]);

  function notify(message: string) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3500);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEdit(record: BirthdayRecord) {
    setEditing(record);
    setForm({
      matricule: record.matricule,
      fullName: record.fullName,
      birthDate: record.birthDate,
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        editing ? `/api/anniversaires/${editing.id}` : "/api/anniversaires",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(form),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Enregistrement impossible");
      }
      closeForm();
      notify(
        editing
          ? "Employé mis à jour."
          : "Employé ajouté à la liste des employés."
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(record: BirthdayRecord) {
    setError("");
    setSuccess("");
    setDeleteTarget(record);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;

    setDeletingId(target.id);
    setError("");
    try {
      const res = await fetch(`/api/anniversaires/${target.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Suppression impossible");
      }
      setDeleteTarget(null);
      notify("Employé supprimé.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="birthdays-page">
      <header className="rh-banner">
        <div className="rh-banner-content">
          <h1>👥 Liste des employés</h1>
          <p>
            Matricule, nom et date de naissance des collaborateurs. Cette liste
            est réservée à l’administration et aux ressources humaines.
          </p>
        </div>
      </header>

      {error && <p className="alert alert-error">{error}</p>}
      {success && <p className="alert alert-success">{success}</p>}

      <section className="feed-card birthday-panel">
        <div className="birthday-toolbar">
          <div>
            <h2>Employés</h2>
            <p className="fb-widget-desc">
              {records.length} enregistrement{records.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="birthday-toolbar-actions">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un matricule ou un nom…"
              aria-label="Rechercher un employé"
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              + Ajouter
            </button>
          </div>
        </div>

        {loading ? (
          <p className="fb-widget-desc">Chargement de la liste…</p>
        ) : (
          <div className="birthday-table-wrap">
            <table className="birthday-table">
              <thead>
                <tr>
                  <th>N° Matricule</th>
                  <th>Nom &amp; Prénoms</th>
                  <th>Date de naissance</th>
                  <th className="birthday-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="birthday-empty">
                      Aucun employé trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr key={record.id}>
                      <td>{record.matricule}</td>
                      <td>{record.fullName}</td>
                      <td>{formatBirthDate(record.birthDate)}</td>
                      <td className="birthday-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(record)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={deletingId === record.id}
                          onClick={() => requestDelete(record)}
                        >
                          {deletingId === record.id ? "Suppression…" : "Supprimer"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <form className="modal-card birthday-form" onSubmit={handleSubmit}>
            <h3>
              {editing ? "Modifier l’employé" : "Ajouter un employé"}
            </h3>
            <p>Les informations saisies ne sont visibles que par la RH et l’administrateur.</p>

            <p className="form-group">
              <label htmlFor="birth-matricule">N° Matricule</label>
              <input
                id="birth-matricule"
                value={form.matricule}
                onChange={(e) =>
                  setForm((current) => ({ ...current, matricule: e.target.value }))
                }
                required
                maxLength={50}
                autoComplete="off"
              />
            </p>

            <p className="form-group">
              <label htmlFor="birth-name">Nom &amp; Prénoms</label>
              <input
                id="birth-name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((current) => ({ ...current, fullName: e.target.value }))
                }
                required
                maxLength={200}
                autoComplete="off"
              />
            </p>

            <p className="form-group">
              <label htmlFor="birth-date">Date de naissance</label>
              <input
                id="birth-date"
                type="date"
                value={form.birthDate}
                onChange={(e) =>
                  setForm((current) => ({ ...current, birthDate: e.target.value }))
                }
                required
              />
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={closeForm}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && deletingId === null) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="modal-card birthday-delete-modal" role="dialog" aria-modal="true">
            <h3>Confirmer la suppression</h3>
            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>{deleteTarget.fullName}</strong> (matricule{" "}
              {deleteTarget.matricule}) de la liste des employés ?
            </p>
            <p className="fb-widget-desc">Cette action est irréversible.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={deletingId !== null}
                onClick={() => setDeleteTarget(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={deletingId !== null}
                onClick={() => void confirmDelete()}
              >
                {deletingId !== null ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
