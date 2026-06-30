import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashClientIp, isChatBanned } from "@/lib/chat-moderation";

const schema = z.object({
  sessionId: z.string().min(1).max(40),
  author: z.string().min(1).max(80),
  channel: z.string().max(50).default("general"),
});

export async function POST(request: Request) {
  const ipHash = hashClientIp(request);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  if (await isChatBanned(parsed.data.sessionId, ipHash)) {
    return NextResponse.json({ error: "Banni" }, { status: 403 });
  }

  await prisma.chatTyping.upsert({
    where: {
      sessionId_channel: {
        sessionId: parsed.data.sessionId,
        channel: parsed.data.channel,
      },
    },
    create: {
      sessionId: parsed.data.sessionId,
      channel: parsed.data.channel,
      author: parsed.data.author,
    },
    update: {
      author: parsed.data.author,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
