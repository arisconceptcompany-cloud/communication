import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  anonymousLabel: z.string().max(80).optional(),
});

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

  const comment = await prisma.postComment.create({
    data: {
      postId: id,
      authorId: session.id,
      body: parsed.data.body,
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
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      isAnonymous: comment.isAnonymous,
      anonymousLabel: comment.anonymousLabel,
      author: comment.author,
      replies: [],
    },
  });
}
