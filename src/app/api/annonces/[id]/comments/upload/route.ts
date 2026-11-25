import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  COMMENT_DOCUMENT_EXTENSIONS,
  COMMENT_IMAGE_EXTENSIONS,
  COMMENT_MAX_BYTES,
} from "@/lib/comment-attachments";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.announcement.findUnique({
    where: { id },
    select: { deletedAt: true, allowComments: true },
  });
  if (!post || post.deletedAt || !post.allowComments) {
    return NextResponse.json(
      { error: "Publication introuvable" },
      { status: 404 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
  }
  if (file.size > COMMENT_MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (5 Mo max)" },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  const isImage = COMMENT_IMAGE_EXTENSIONS.includes(ext);
  const isDocument = COMMENT_DOCUMENT_EXTENSIONS.includes(ext);
  if (!isImage && !isDocument) {
    return NextResponse.json(
      {
        error:
          "Type non autorisé (photos : JPG, PNG, WEBP · fichiers : PDF, DOC, XLS)",
      },
      { status: 400 }
    );
  }

  const name = `comment-${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "comments");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, name),
    Buffer.from(await file.arrayBuffer())
  );

  const url = `/uploads/comments/${name}`;
  return NextResponse.json({
    url,
    imageUrl: isImage ? url : null,
    attachmentUrl: isImage ? null : url,
    attachmentName: file.name.slice(0, 200),
  });
}
