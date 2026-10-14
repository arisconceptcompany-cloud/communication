"use client";

import { ContactsButton } from "@/components/ContactsButton";
import { isContactsDoc } from "@/lib/contacts";

type HubDoc = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
};

export function HubDocuments({ documents }: { documents: HubDoc[] }) {
  return (
    <ul className="hub-doc-list">
      {documents.map((doc) => {
        const isContacts = isContactsDoc(doc.title);
        const isPdf = doc.url ? /\.pdf$/i.test(doc.url) : false;
        return (
          <li key={doc.id} className="hub-doc-item">
            {isContacts ? (
              <ContactsButton className="hub-doc-link">
                <strong>{doc.title}</strong>
              </ContactsButton>
            ) : doc.url ? (
              <a
                href={doc.url}
                target={doc.url.startsWith("http") ? "_blank" : undefined}
                rel={doc.url.startsWith("http") ? "noopener noreferrer" : undefined}
                download={isPdf ? "" : undefined}
              >
                <strong>{doc.title}</strong>
              </a>
            ) : (
              <strong>{doc.title}</strong>
            )}
            {doc.description && (
              <p className="fb-widget-desc">{doc.description}</p>
            )}
            <span className="badge">{doc.category}</span>
          </li>
        );
      })}
    </ul>
  );
}
