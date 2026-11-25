"use client";

import { useEffect, useRef, useState } from "react";

type Slide = {
  image: string;
  name: string;
  message: string;
};

/** L'ordre est mélangé à chaque tour : 3 photos / 3 textes, un seul à la fois. */
const SLIDES: Slide[] = [
  {
    image: "/sary/HARISOA.webp",
    name: "Harisoa",
    message: "L'intellingence tarifaire humaine et augmantée",
  },
  {
    image: "/sary/MURIELLE.webp",
    name: "Murielle",
    message: "De la donne brute a la decision eclairee",
  },
  {
    image: "/sary/OLIVA.webp",
    name: "Oliva",
    message: "La precision de l'IA. La fiabilite de l'humain",
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

export function HomeHeroBanner() {
  // Valeurs déterministes au premier rendu pour éviter toute erreur #418.
  const [sequence, setSequence] = useState<number[]>([0, 1, 2]);
  const [position, setPosition] = useState(0);
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setSequence(shuffle());
    setPosition(Math.floor(Math.random() * SLIDES.length));

    const interval = window.setInterval(() => {
      setVisible(false);
      timeoutRef.current = window.setTimeout(() => {
        setPosition((current) => {
          const next = current + 1;
          if (next >= SLIDES.length) {
            setSequence(shuffle());
            return 0;
          }
          return next;
        });
        setVisible(true);
      }, 350);
    }, 4500);

    return () => {
      window.clearInterval(interval);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const active = SLIDES[sequence[position] ?? 0];
  const animationClass = visible
    ? "feed-hero-fade--in"
    : "feed-hero-fade--out";

  return (
    <section className="home-promo-strip" aria-label="Message VALUE-IT">
      <div className="home-promo-copy" aria-live="polite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="home-promo-logo"
          src="/logo-valueit-compact.svg"
          alt="VALUE-IT"
          width={64}
          height={22}
        />
        <strong className={`home-promo-message home-promo-fade ${animationClass}`}>
          <span className="home-promo-dash">–</span> {active.message}
        </strong>
      </div>

      <div className={`home-promo-photo home-promo-fade ${animationClass}`}>
        <div className="home-promo-photo-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.image}
            alt={`Portrait VALUE-IT — ${active.name}`}
            width={56}
            height={56}
          />
        </div>
      </div>
    </section>
  );
}
