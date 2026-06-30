export const CHAT_REACTIONS = [
  { id: "like", emoji: "👍" },
  { id: "love", emoji: "❤️" },
  { id: "laugh", emoji: "😂" },
  { id: "wow", emoji: "😮" },
  { id: "sad", emoji: "😢" },
  { id: "angry", emoji: "😡" },
] as const;

export function reactionIdToEmoji(id: string) {
  return CHAT_REACTIONS.find((r) => r.id === id)?.emoji ?? "👍";
}
