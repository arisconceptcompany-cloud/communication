import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sessionId: z.string().min(1).max(40),
  emoji: z.string().min(1).max(8),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  const existing = await prisma.chatReaction.findUnique({
    where: {
      messageId_sessionId: { messageId: id, sessionId: parsed.data.sessionId },
    },
  });

  if (existing) {
    if (existing.emoji === parsed.data.emoji) {
      await prisma.chatReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.chatReaction.update({
        where: { id: existing.id },
        data: { emoji: parsed.data.emoji },
      });
    }
  } else {
    await prisma.chatReaction.create({
      data: {
        messageId: id,
        sessionId: parsed.data.sessionId,
        emoji: parsed.data.emoji,
      },
    });
  }

  const reactions = await prisma.chatReaction.findMany({ where: { messageId: id } });
  const summary = reactions.reduce(
    (acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const myReaction =
    reactions.find((r) => r.sessionId === parsed.data.sessionId)?.emoji ?? null;

  return NextResponse.json({ reactions: summary, myReaction });
}
