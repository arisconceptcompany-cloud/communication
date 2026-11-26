"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./HomeHeroBanner.css";

type Slide = {
  image: string;
  name: string;
  lines: [string, string];
};

const SLIDES: Slide[] = [
  {
    image: "/sary/HARISOA.webp",
    name: "Harisoa",
    lines: ["L'intelligence tarifaire", "humaine et augmentée"],
  },
  {
    image: "/sary/MURIELLE.webp",
    name: "Murielle",
    lines: ["De la donnée brute", "à la décision éclairée"],
  },
  {
    image: "/sary/OLIVA.webp",
    name: "Oliva",
    lines: ["La précision de l'IA.", "La fiabilité de l'humain"],
  },
];

function shuffle(): number[] {
  const indexes = SLIDES.map((_, i) => i);
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}

/** Découpe une ligne en mots, chacun dans un masque pour l'effet "glisse vers le haut". */
function Words({ text, offset }: { text: string; offset: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span className="hero-word-mask" key={`${word}-${i}`}>
          <span
            className="hero-word"
            style={{ "--i": offset + i } as CSSProperties}
          >
            {word}
          </span>
        </span>
      ))}
    </>
  );
}

type Props = {
  title: string;
  subtitle: string;
};

// Durée de l'animation de sortie avant de changer de slide (doit rester < intervalle).
const EXIT_MS = 550;
const INTERVAL_MS = 4500;

export function HomeHeroBanner({ title, subtitle }: Props) {
  // Valeurs déterministes au premier rendu pour éviter l'erreur d'hydratation #418.
  const [sequence, setSequence] = useState<number[]>([0, 1, 2]);
  const [position, setPosition] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setSequence(shuffle());
    setPosition(Math.floor(Math.random() * SLIDES.length));
    setReady(true);

    const interval = window.setInterval(() => {
      setLeaving(true);
      timeoutRef.current = window.setTimeout(() => {
        setPosition((current) => {
          const next = current + 1;
          if (next >= SLIDES.length) {
            setSequence(shuffle());
            return 0;
          }
          return next;
        });
        setLeaving(false);
      }, EXIT_MS);
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const active = SLIDES[sequence[position] ?? 0];

  return (
    <header className="feed-page-header hero-banner">
      <div className="hero-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className={`hero-right ${leaving ? "hero-out" : ""}`}>
        {ready && (
          <>
            {/* key : remonte l'élément à chaque slide, ce qui rejoue l'animation d'entrée */}
            <div
              key={`text-${active.name}`}
              className="hero-message"
              aria-live="polite"
            >
              <span className="hero-line hero-line--1">
                <Words text={active.lines[0]} offset={0} />
              </span>
              <span className="hero-line hero-line--2">
                <Words
                  text={active.lines[1]}
                  offset={active.lines[0].split(" ").length}
                />
              </span>
            </div>

            <div key={`photo-${active.name}`} className="hero-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.image}
                alt={`Portrait VALUE-IT — ${active.name}`}
                width={160}
                height={200}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}