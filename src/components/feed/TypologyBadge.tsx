import { getTypology } from "@/lib/post-typologies";

export function TypologyBadge({ category }: { category: string }) {
  const typo = getTypology(category);

  return (
    <span className={`typology-badge ${typo.cssClass}`}>
      <span className="typology-badge-emoji" aria-hidden>
        {typo.emoji}
      </span>
      {typo.label}
    </span>
  );
}
