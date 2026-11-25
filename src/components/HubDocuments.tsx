"use client";

import { useEffect, useState } from "react";
import { ContactsButton } from "@/components/ContactsButton";
import { isContactsDoc } from "@/lib/contacts";

type HubDoc = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
  noteLabel?: string | null;
  noteText?: string | null;
};

type ActiveNote = { label: string; text: string };

export function HubDocuments({ documents }: { documents: HubDoc[] }) {
  const [activeNote, setActiveNote] = useState<ActiveNote | null>(null);

  useEffect(() => {
    if (!activeNote) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveNote(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeNote]);

  return (
    <>
      <ul className="hub-doc-list">
        {documents.map((doc) => {
          const isContacts = isContactsDoc(doc.title);
          const isPdf = doc.url ? /\.pdf$/i.test(doc.url) : false;
          const isExternal = doc.url ? doc.url.startsWith("http") : false;
          const openInNewTab = isExternal || isPdf;
          const noteText = doc.noteText?.trim();
          const noteLabel = doc.noteLabel?.trim() || "Note";
          return (
            <li key={doc.id} className="hub-doc-item">
              {isContacts ? (
                <ContactsButton className="hub-doc-link">
                  <strong>{doc.title}</strong>
                </ContactsButton>
              ) : doc.url ? (
                <a
                  href={doc.url}
                  target={openInNewTab ? "_blank" : undefined}
                  rel={openInNewTab ? "noopener noreferrer" : undefined}
                  title={isPdf ? "Consulter le PDF (nouvel onglet)" : undefined}
                >
                  <strong>{doc.title}</strong>
                </a>
              ) : (
                <strong>{doc.title}</strong>
              )}
              {doc.description && (
                <p className="fb-widget-desc">{doc.description}</p>
              )}
              <span className="hub-doc-badges">
                <span className="badge">{doc.category}</span>
                {noteText && (
                  <button
                    type="button"
                    className="hub-doc-note"
                    title={`Lire la note : ${noteLabel}`}
                    onClick={() =>
                      setActiveNote({ label: noteLabel, text: noteText })
                    }
                  >
                    {noteLabel}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {activeNote && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveNote(null);
          }}
        >
          <div
            className="modal-card hub-note-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hub-note-title"
          >
            <div className="hub-note-icon" aria-hidden="true">
              ℹ️
            </div>
            <h3 id="hub-note-title">{activeNote.label}</h3>
            <p>{activeNote.text}</p>
            <div className="modal-actions modal-actions--center">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveNote(null)}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
