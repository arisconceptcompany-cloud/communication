import { nanoid } from "nanoid";

const EMOJIS = ["🦊", "🤖", "🐼", "🦁", "🐨", "🦄", "🐸", "🦉", "🐙", "🦋", "🐧", "🐱", "🐶", "🐰", "🐲", "🐻", "🐯", "🐺", "🦅", "🐵"];
const ANIMALS = [
  "Renard",
  "Robot",
  "Panda",
  "Lion",
  "Koala",
  "Licorne",
  "Grenouille",
  "Hibou",
  "Pieuvre",
  "Papillon",
  "Manchot",
  "Chat",
  "Chien",
  "Lapin",
  "Dragon",
  "Ours",
  "Tigre",
  "Loup",
  "Aigle",
  "Singe",
];
const COLORS = ["Bleu", "Vert", "Orange", "Violet", "Rose", "Cyan", "Jaune", "Rouge", "Indigo", "Menthe"];

export type AnonymousIdentity = {
  emoji: string;
  label: string;
  color: string;
  sessionId: string;
  displayName: string;
};

const STORAGE_KEY = "valueit_anon_identity";

function randomIdentity(): AnonymousIdentity {
  const idx = Math.floor(Math.random() * EMOJIS.length);
  const emoji = EMOJIS[idx];
  const animal = ANIMALS[idx];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const label = `Anonyme_${animal}_${color}`;
  const sessionId = nanoid(10);
  return {
    emoji,
    label,
    color,
    sessionId,
    displayName: `${emoji} ${label}`,
  };
}

export function getAnonymousIdentity(): AnonymousIdentity {
  if (typeof window === "undefined") {
    const fallback = randomIdentity();
    return fallback;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as AnonymousIdentity;
      if (parsed.sessionId && parsed.label) {
        return {
          ...parsed,
          displayName: `${parsed.emoji} ${parsed.label}`,
        };
      }
    } catch {
      /* regenerate */
    }
  }

  const identity = randomIdentity();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function regenerateAnonymousIdentity(): AnonymousIdentity {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return getAnonymousIdentity();
}

export function getSessionShortId(sessionId: string) {
  return sessionId.slice(0, 3).toUpperCase();
}
