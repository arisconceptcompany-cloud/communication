import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { hashClientIp, isChatBanned } from "@/lib/chat-moderation";

export async function POST(request: Request) {
  const sessionId = request.headers.get("x-chat-session") || "";
  const ipHash = hashClientIp(request);

  if (sessionId && (await isChatBanned(sessionId, ipHash))) {
    return NextResponse.json({ error: "Accès suspendu" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 3 Mo" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".xlsx", ".docx"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Type non autorisé" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const name = `chat-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), Buffer.from(bytes));

  const url = `/uploads/chat/${name}`;
  const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);

  return NextResponse.json({
    url,
    imageUrl: isImage ? url : null,
    attachmentUrl: isImage ? null : url,
  });
}
