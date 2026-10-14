"use client";

import { useState, type ReactNode } from "react";
import { Phone, Mail, X } from "lucide-react";
import { USEFUL_CONTACTS, telHref } from "@/lib/contacts";

function ContactsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <article
        className="modal-card contacts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="contacts-modal-header">
          <h3>Contacts utiles</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>
        <p className="fb-widget-desc" style={{ marginBottom: "1rem" }}>
          Choisissez la personne à contacter, puis appelez-la ou envoyez-lui un
          e-mail.
        </p>
        <ul className="contacts-list">
          {USEFUL_CONTACTS.map((c) => (
            <li key={c.email} className="contact-card">
              <div className="contact-info">
                <strong className="contact-name">{c.name}</strong>
                <span className="contact-role">{c.role}</span>
                <span className="contact-detail">{c.phone}</span>
                <span className="contact-detail">{c.email}</span>
              </div>
              <div className="contact-actions">
                <a className="contact-action" href={telHref(c.phone)}>
                  <Phone size={15} /> Appeler
                </a>
                <a className="contact-action" href={`mailto:${c.email}`}>
                  <Mail size={15} /> E-mail
                </a>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

export function ContactsButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <ContactsModal onClose={() => setOpen(false)} />}
    </>
  );
}
