import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { isValidTypology } from "@/lib/post-typologies";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  body: z.string().min(10).optional(),
  category: z.string().min(1).optional(),
  published: z.boolean().optional(),
  pinned: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  allowReactions: z.boolean().optional(),
  allowAnonymousComments: z.boolean().optional(),
  moodActivity: z.string().max(200).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  targetDepartment: z.string().max(100).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.deletedAt) {
    return NextResponse.json(
      { error: "Publication introuvable" },
      { status: 404 }
    );
  }

  const canEdit =
    post.authorId === session.id || isRhOrAdmin(session.role);
  if (!canEdit) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  if (parsed.data.category && !isValidTypology(parsed.data.category)) {
    return NextResponse.json({ error: "Typologie invalide" }, { status: 400 });
  }

  const pinned =
    parsed.data.pinned === true && isRhOrAdmin(session.role)
      ? true
      : parsed.data.pinned === false
        ? false
        : undefined;

  if (parsed.data.title || parsed.data.body) {
    await prisma.postRevision.create({
      data: {
        postId: id,
        title: post.title,
        body: post.body,
        editorId: session.id,
      },
    });
  }

  await prisma.announcement.update({
    where: { id },
    data: {
      ...parsed.data,
      pinned,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.deletedAt) {
    return NextResponse.json(
      { error: "Publication introuvable" },
      { status: 404 }
    );
  }

  const canDelete =
    post.authorId === session.id || isRhOrAdmin(session.role);
  if (!canDelete) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.announcement.update({
    where: { id },
    data: { deletedAt: new Date(), pinned: false },
  });

  return NextResponse.json({ ok: true });
}
