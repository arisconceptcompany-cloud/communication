export type MediaItem = {
  type: "image" | "video";
  url: string;
  label?: string;
};

export function parseMediaGallery(raw: string | null | undefined): MediaItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MediaItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseTaggedIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
