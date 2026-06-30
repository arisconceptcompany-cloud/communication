export const REACTION_TYPES = [
  { id: "like", emoji: "👍", label: "J'aime" },
  { id: "love", emoji: "❤️", label: "J'adore" },
  { id: "idea", emoji: "💡", label: "Bonne idée" },
  { id: "wow", emoji: "😮", label: "Waouh" },
  { id: "clap", emoji: "👏", label: "Bravo" },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]["id"];

export function isValidReactionType(type: string): type is ReactionType {
  return REACTION_TYPES.some((r) => r.id === type);
}

export function reactionEmoji(type: string) {
  return REACTION_TYPES.find((r) => r.id === type)?.emoji ?? "👍";
}
