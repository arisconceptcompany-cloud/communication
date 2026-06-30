import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashClientIp } from "@/lib/chat-moderation";

const schema = z.object({
  messageId: z.string().optional(),
  sessionId: z.string().optional(),
  reason: z.string().min(3).max(500),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Signalement invalide" }, { status: 400 });
  }

  await prisma.chatReport.create({
    data: {
      messageId: parsed.data.messageId ?? null,
      sessionId: parsed.data.sessionId ?? null,
      ipHash: hashClientIp(request),
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ ok: true });
}
