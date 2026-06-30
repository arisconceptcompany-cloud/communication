import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession, isRhOrAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (5 Mo max)" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".mp4", ".webm"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), buffer);

  return NextResponse.json({ url: `/uploads/${name}` });
}
