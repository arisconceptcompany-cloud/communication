import Link from "next/link";
import type { CSSProperties } from "react";
import { Heart } from "lucide-react";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { getTodayBirthdays } from "@/lib/birthdays";
import { prisma } from "@/lib/prisma";
import { IdeaBoxWidget } from "@/components/IdeaModal";
import { ContactsButton } from "@/components/ContactsButton";
import { isContactsDoc } from "@/lib/contacts";
import { PostAvatar } from "./PostAvatar";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "Ressources Humaines",
  EMPLOYEE: "Collaborateur",
};

// Décor fixe et déterministe : aucune valeur aléatoire pendant le rendu.
const CONFETTI = [
  { x: "6%", delay: "0s", color: "#f68a15", drift: "-14px" },
  { x: "18%", delay: "-0.7s", color: "#ffd166", drift: "10px" },
  { x: "31%", delay: "-1.4s", color: "#ffffff", drift: "-8px" },
  { x: "44%", delay: "-2.1s", color: "#f68a15", drift: "16px" },
  { x: "57%", delay: "-0.3s", color: "#ef476f", drift: "-12px" },
  { x: "69%", delay: "-1.8s", color: "#ffd166", drift: "9px" },
  { x: "82%", delay: "-1.1s", color: "#ffffff", drift: "-16px" },
  { x: "94%", delay: "-2.6s", color: "#f68a15", drift: "12px" },
];

const FIREWORK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// Messages de vœux : un message différent selon le jour du mois (déterministe).
const WISHES = [
  "Que cette nouvelle année de vie vous apporte santé, sérénité et belles réussites. Merci pour l'énergie, la bienveillance et le talent que vous mettez chaque jour au service de Value-IT.",
  "Aujourd'hui, c'est votre journée ! Que le bonheur vous entoure, que vos projets prennent vie et que chaque instant soit rempli de joie auprès de ceux que vous aimez.",
  "Une année de plus, c'est une année de belles histoires. Toute l'équipe est fière de vous compter parmi nous et vous souhaite un anniversaire rempli de rires, de douceur et de gratitude.",
];
const WISH_SIGNATURE = "Avec toute notre affection, l'équipe Value-IT 🎂";

/**
 * Sépare prénom / nom.
 * - "RAKOTO Jean"  → prénom = "Jean" (convention NOM Prénom)
 * - "Jean Rakoto"  → prénom = "Jean"
 */
function splitName(full: string): {
  first: string;
  rest: string;
  reversed: boolean;
} {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] ?? "", rest: "", reversed: false };

  const isUpper = (s: string) => s === s.toUpperCase() && s !== s.toLowerCase();

  if (isUpper(parts[0])) {
    const idx = parts.findIndex((p) => !isUpper(p));
    if (idx > 0) {
      return {
        first: parts.slice(idx).join(" "),
        rest: parts.slice(0, idx).join(" "),
        reversed: true,
      };
    }
  }
  return { first: parts[0], rest: parts.slice(1).join(" "), reversed: false };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/** Affiche le nom complet ; le prénom reçoit l'effet de reflet lumineux (rejoué toutes les heures). */
function BirthdayName({ name }: { name: string }) {
  const { first, rest, reversed } = splitName(name);

  const firstEl = <span className="fb-birthday-first">{first}</span>;
  const restEl = rest ? <span className="fb-birthday-last">{rest}</span> : null;

  if (!restEl) return firstEl;
  return reversed ? (
    <>
      {restEl} {firstEl}
    </>
  ) : (
    <>
      {firstEl} {restEl}
    </>
  );
}

export async function FeedLeftRail() {
  const session = await getSession();
  const [documents, birthdays] = await Promise.all([
    prisma.hubDocument.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      take: 5,
    }),
    getTodayBirthdays(),
  ]);

  const hasBirthdays = birthdays.length > 0;
  const firstNames = birthdays.map((person) => splitName(person.name).first);
  const wish = WISHES[new Date().getDate() % WISHES.length];

  return (
    <aside className="fb-left-rail">
      {session && (
        <section className="feed-card fb-profile-card">
          <PostAvatar name={session.name} size={52} />
          <div className="fb-profile-info">
            <strong>{session.name}</strong>
            <span>
              {session.department || ROLE_LABELS[session.role] || "Collaborateur"}
            </span>
          </div>
        </section>
      )}

      <section className="feed-card fb-widget">
        <h3>Raccourcis</h3>
        <nav className="fb-quick-links">
          <Link href="/hub">📂 Base documentaire</Link>
          <Link href="/annonces">📢 Annonces officielles</Link>
          <Link href="/rh">👥 Espace RH</Link>
          <Link href="/organigramme">📊 Organigramme</Link>
          {session && isRhOrAdmin(session.role) && (
            <Link href="/anniversaires">👥 Liste des employés</Link>
          )}
        </nav>
      </section>

      <section
        className={`feed-card fb-widget fb-birthdays ${
          hasBirthdays ? "fb-birthdays--active" : ""
        }`}
        aria-label="Anniversaires du jour"
      >
        {hasBirthdays && (
          <div className="fb-birthdays-celebration" aria-hidden="true">
            {CONFETTI.map((piece, index) => (
              <span
                key={`confetti-${index}`}
                className="fb-birthday-confetti"
                style={
                  {
                    "--x": piece.x,
                    "--delay": piece.delay,
                    "--color": piece.color,
                    "--drift": piece.drift,
                  } as CSSProperties
                }
              />
            ))}
            <span className="fb-birthday-firework">
              {FIREWORK_ANGLES.map((angle, index) => (
                <span
                  key={`ray-${index}`}
                  style={
                    {
                      "--angle": `${angle}deg`,
                      "--delay": `${index * 0.08}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
            <span className="fb-birthdays-champagne">🍾</span>
            <span className="fb-birthday-cork">✨</span>
          </div>
        )}

        <h3 className="fb-birthdays-title">
          <span className="fb-birthdays-gift" aria-hidden="true">
            🎁
          </span>
          Anniversaires du jour
          {hasBirthdays && (
            <span
              className="fb-birthdays-count"
              aria-label={`${birthdays.length} anniversaire(s)`}
            >
              {birthdays.length}
            </span>
          )}
        </h3>

        {hasBirthdays ? (
          <>
            <ul className="fb-birthday-list">
              {birthdays.map((person, index) => (
                <li key={person.id}>
                  <span className="fb-birthdays-sparkle" aria-hidden="true">
                    ✨
                  </span>
                  <span className="fb-birthday-info">
                    <strong
                      className="fb-birthday-name"
                      style={{ "--i": index } as CSSProperties}
                    >
                      <BirthdayName name={person.name} />
                    </strong>
                    {person.department && (
                      <span className="fb-birthday-dept">{person.department}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="fb-birthday-wish" role="note">
              <p className="fb-birthday-wish-title">
                <Heart size={15} aria-hidden="true" />
                Joyeux anniversaire, {joinNames(firstNames)} !
              </p>
              <p className="fb-birthday-wish-text">{wish}</p>
              <p className="fb-birthday-wish-sign">{WISH_SIGNATURE}</p>
            </div>
          </>
        ) : (
          <p className="fb-widget-desc fb-birthdays-empty">
            Aucun anniversaire aujourd&apos;hui.
          </p>
        )}
      </section>

      <IdeaBoxWidget />
    </aside>
  );
}