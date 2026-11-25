import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isCommentDocumentUrl,
  isCommentImageUrl,
} from "@/lib/comment-attachments";

const schema = z
  .object({
    body: z.string().max(2000).default(""),
    parentId: z.string().optional(),
    isAnonymous: z.boolean().optional(),
    anonymousLabel: z.string().max(80).optional(),
    imageUrl: z.string().nullable().optional(),
    attachmentUrl: z.string().nullable().optional(),
    attachmentName: z.string().max(200).nullable().optional(),
  })
  .refine(
    (data) =>
      data.body.trim().length > 0 ||
      Boolean(data.imageUrl || data.attachmentUrl),
    { message: "Ajoutez un message ou une pièce jointe" }
  )
  .refine((data) => !(data.imageUrl && data.attachmentUrl), {
    message: "Une seule pièce jointe par commentaire",
  })
  .refine((data) => !data.imageUrl || isCommentImageUrl(data.imageUrl), {
    message: "Photo invalide",
  })
  .refine(
    (data) => !data.attachmentUrl || isCommentDocumentUrl(data.attachmentUrl),
    { message: "Fichier invalide" }
  );

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.deletedAt || !post.allowComments) {
    return NextResponse.json(
      { error: "Publication introuvable" },
      { status: 404 }
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Commentaire invalide" }, { status: 400 });
  }

  const isAnonymous = parsed.data.isAnonymous === true;
  if (isAnonymous && !post.allowAnonymousComments) {
    return NextResponse.json(
      { error: "Commentaires anonymes non autorisés" },
      { status: 403 }
    );
  }

  if (parsed.data.parentId) {
    const parent = await prisma.postComment.findFirst({
      where: { id: parsed.data.parentId, postId: id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Commentaire parent introuvable" },
        { status: 400 }
      );
    }
  }

  const comment = await prisma.postComment.create({
    data: {
      postId: id,
      authorId: session.id,
      body: parsed.data.body.trim(),
      imageUrl: parsed.data.imageUrl ?? null,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
      attachmentName: parsed.data.attachmentName?.trim() || null,
      parentId: parsed.data.parentId ?? null,
      isAnonymous,
      anonymousLabel: isAnonymous
        ? (parsed.data.anonymousLabel ?? "Anonyme")
        : null,
    },
    include: {
      author: { select: { id: true, name: true, department: true } },
    },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      imageUrl: comment.imageUrl,
      attachmentUrl: comment.attachmentUrl,
      attachmentName: comment.attachmentName,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      isAnonymous: comment.isAnonymous,
      anonymousLabel: comment.anonymousLabel,
      author: comment.author,
      replies: [],
    },
  });
}
