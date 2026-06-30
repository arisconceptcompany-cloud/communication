export type PostTypology = {
  id: string;
  label: string;
  emoji: string;
  cssClass: string;
};

export const POST_TYPOLOGIES: PostTypology[] = [
  { id: "general", label: "Général", emoji: "📢", cssClass: "typo-general" },
  { id: "evenement", label: "Événement", emoji: "📅", cssClass: "typo-evenement" },
  { id: "procedure", label: "Procédure", emoji: "📋", cssClass: "typo-procedure" },
  { id: "urgent", label: "Urgent", emoji: "🚨", cssClass: "typo-urgent" },
  { id: "info", label: "Info", emoji: "ℹ️", cssClass: "typo-info" },
  { id: "celebration", label: "Célébration", emoji: "🎉", cssClass: "typo-celebration" },
  { id: "rh", label: "RH", emoji: "👥", cssClass: "typo-rh" },
  { id: "technique", label: "Technique", emoji: "🛠️", cssClass: "typo-technique" },
];

const TYPOLOGY_IDS = new Set(POST_TYPOLOGIES.map((t) => t.id));

export function isValidTypology(category: string) {
  return TYPOLOGY_IDS.has(category);
}

export function getTypology(category: string): PostTypology {
  return (
    POST_TYPOLOGIES.find((t) => t.id === category) ??
    POST_TYPOLOGIES[0]
  );
}
