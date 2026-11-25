import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type Params = { params: Promise<{ path: string[] }> };

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function safeFilePath(segments: string[]): string | null {
  if (!segments.length) return null;

  const relative = path.posix.normalize(segments.join("/"));
  if (!relative || relative === "." || relative.startsWith("..")) return null;
  if (relative.includes("\\") || path.isAbsolute(relative)) return null;

  const root = path.resolve(process.cwd(), "public", "uploads");
  const file = path.resolve(root, relative);
  if (!file.startsWith(`${root}${path.sep}`)) return null;
  return file;
}

/**
 * Sert les fichiers uploadés en lisant le disque à chaque requête.
 * Contrairement au handler statique de `public/`, un fichier créé après le
 * démarrage du serveur est donc immédiatement disponible.
 */
export async function GET(request: Request, { params }: Params) {
  const filePath = safeFilePath((await params).path);
  if (!filePath) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).replace(/["\r\n]/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "EISDIR") {
      console.error("Lecture upload impossible :", filePath, error);
    }
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

export async function HEAD(request: Request, context: Params) {
  const response = await GET(request, context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
