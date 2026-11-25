/** Pièces jointes autorisées dans les commentaires de publications. */

// Pas de GIF : seulement les photos et les documents de bureau.
export const COMMENT_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const COMMENT_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];
export const COMMENT_MAX_BYTES = 5 * 1024 * 1024;

const COMMENT_UPLOAD_URL = /^\/uploads\/comments\/[A-Za-z0-9._-]+$/;

export function isValidCommentUploadUrl(
  url: string | null | undefined
): boolean {
  return Boolean(url && COMMENT_UPLOAD_URL.test(url));
}

export function isCommentImageUrl(url: string | null | undefined): boolean {
  if (!url || !isValidCommentUploadUrl(url)) return false;
  const lower = url.toLowerCase();
  return COMMENT_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isCommentDocumentUrl(url: string | null | undefined): boolean {
  if (!url || !isValidCommentUploadUrl(url)) return false;
  const lower = url.toLowerCase();
  return COMMENT_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function commentFileIcon(name: string | null | undefined): string {
  const ext = name?.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  if (ext === ".xls" || ext === ".xlsx") return "📊";
  if (ext === ".doc" || ext === ".docx") return "📝";
  if (ext === ".pdf") return "📕";
  return "📎";
}
