"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SearchResult = {
  colleagues: {
    id: string;
    name: string;
    title: string | null;
    department: string;
    email: string | null;
  }[];
  announcements: {
    id: string;
    title: string;
    body: string;
    createdAt: string;
  }[];
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      setLoading(false);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOpen(true);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasResults =
    results &&
    (results.colleagues.length > 0 || results.announcements.length > 0);

  return (
    <div className="top-bar-search-wrap" ref={wrapRef}>
      <input
        type="search"
        className="top-bar-search-input"
        placeholder="Collègue, annonce RH…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        aria-label="Recherche globale"
      />
      {open && (
        <div className="search-dropdown">
          {loading && <p className="search-dropdown-empty">Recherche…</p>}
          {!loading && !hasResults && (
            <p className="search-dropdown-empty">Aucun résultat</p>
          )}
          {!loading && results && results.colleagues.length > 0 && (
            <section>
              <h4>Organigramme</h4>
              <ul>
                {results.colleagues.map((c) => (
                  <li key={c.id}>
                    <Link href="/organigramme" onClick={() => setOpen(false)}>
                      <strong>{c.name}</strong>
                      <span>
                        {c.title || c.department}
                        {c.email ? ` · ${c.email}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!loading && results && results.announcements.length > 0 && (
            <section>
              <h4>Annonces</h4>
              <ul>
                {results.announcements.map((a) => (
                  <li key={a.id}>
                    <Link href="/" onClick={() => setOpen(false)}>
                      <strong>{a.title}</strong>
                      <span>{a.body.slice(0, 80)}…</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
