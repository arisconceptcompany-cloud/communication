import type { MediaItem } from "@/lib/post-media";

type Props = {
  imageUrl: string | null;
  videoUrl: string | null;
  mediaGallery: MediaItem[];
  onLinkClick?: () => void;
};

export function PostMediaGallery({
  imageUrl,
  videoUrl,
  mediaGallery,
}: Props) {
  const items: MediaItem[] = [
    ...mediaGallery,
    ...(imageUrl && !mediaGallery.some((m) => m.url === imageUrl)
      ? [{ type: "image" as const, url: imageUrl }]
      : []),
    ...(videoUrl && !mediaGallery.some((m) => m.url === videoUrl)
      ? [{ type: "video" as const, url: videoUrl, label: "Vidéo" }]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div
      className={`post-media-gallery ${
        items.length > 1 ? "post-media-gallery--grid" : ""
      }`}
    >
      {items.map((item, i) => (
        <figure key={`${item.url}-${i}`} className="post-media-item">
          {item.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={item.label ?? ""} loading="lazy" />
          ) : (
            <video
              src={item.url}
              controls
              muted
              playsInline
              preload="metadata"
              title={item.label ?? "Vidéo"}
            />
          )}
          {item.label && (
            <figcaption className="post-media-caption">{item.label}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
