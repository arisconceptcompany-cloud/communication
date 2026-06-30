import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isValidReactionType } from "@/lib/reactions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  type: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.deletedAt || !post.allowReactions) {
    return NextResponse.json(
      { error: "Publication introuvable" },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const type =
    parsed.success && parsed.data.type && isValidReactionType(parsed.data.type)
      ? parsed.data.type
      : "like";

  const existing = await prisma.postReaction.findUnique({
    where: { postId_userId: { postId: id, userId: session.id } },
  });

  let userReaction: string | null = type;

  if (existing) {
    if (existing.type === type) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
      userReaction = null;
    } else {
      await prisma.postReaction.update({
        where: { id: existing.id },
        data: { type },
      });
    }
  } else {
    await prisma.postReaction.create({
      data: { postId: id, userId: session.id, type },
    });
  }

  const reactions = await prisma.postReaction.findMany({
    where: { postId: id },
    select: { type: true },
  });

  const reactionSummary = ["like", "love", "idea", "wow", "clap"]
    .map((t) => ({
      type: t,
      count: reactions.filter((r) => r.type === t).length,
    }))
    .filter((r) => r.count > 0);

  return NextResponse.json({
    reactionCount: reactions.length,
    userReaction,
    reactionSummary,
  });
}
