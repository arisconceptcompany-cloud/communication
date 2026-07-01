import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashClientIp, isChatBanned } from "@/lib/chat-moderation";

const postSchema = z.object({
  author: z.string().max(80).optional(),
  sessionId: z.string().max(40).optional(),
  content: z.string().min(1).max(2000),
  channel: z.string().max(50).default("general"),
  imageUrl: z.string().max(500).nullable().optional(),
  attachmentUrl: z.string().max(500).nullable().optional(),
});

const TYPING_TTL_MS = 8000;
const PRESENCE_TTL_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") || "general";
  const sessionId = searchParams.get("sessionId") || "";

  const since = new Date(Date.now() - PRESENCE_TTL_MS);
  const typingCutoff = new Date(Date.now() - TYPING_TTL_MS);

  const [messages, typingRows, recentSessions] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { channel },
      orderBy: { createdAt: "asc" },
      take: 120,
      include: {
        reactions: true,
        reads: true,
      },
    }),
    prisma.chatTyping.findMany({
      where: { channel, updatedAt: { gte: typingCutoff } },
    }),
    prisma.chatMessage.findMany({
      where: { channel, createdAt: { gte: since }, sessionId: { not: null } },
      select: { sessionId: true },
    }),
  ]);

  const onlineCount = new Set(
    recentSessions.map((r) => r.sessionId).filter(Boolean)
  ).size;

  const typing = typingRows
    .filter((t) => t.sessionId !== sessionId)
    .map((t) => t.author);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      author: m.author,
      sessionId: m.sessionId,
      content: m.deletedAt ? null : m.content,
      imageUrl: m.deletedAt ? null : m.imageUrl,
      attachmentUrl: m.deletedAt ? null : m.attachmentUrl,
      channel: m.channel,
      createdAt: m.createdAt.toISOString(),
      deletedAt: m.deletedAt?.toISOString() ?? null,
      readCount: m.reads.length,
      reactions: m.deletedAt ? {} : m.reactions.reduce(
        (acc, r) => {
          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      myReaction:
        m.deletedAt ? null : m.reactions.find((r) => r.sessionId === sessionId)?.emoji ?? null,
    })),
    onlineCount: Math.max(onlineCount, typing.length),
    typing,
  });
}

export async function POST(request: Request) {
  const ipHash = hashClientIp(request);
  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const sessionId = parsed.data.sessionId?.trim() || "";
  if (sessionId && (await isChatBanned(sessionId, ipHash))) {
    return NextResponse.json(
      { error: "Accès au salon temporairement suspendu" },
      { status: 403 }
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      author: parsed.data.author?.trim() || "Anonyme",
      sessionId: sessionId || null,
      content: parsed.data.content.trim(),
      channel: parsed.data.channel,
      imageUrl: parsed.data.imageUrl ?? null,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    },
  });

  if (sessionId) {
    await prisma.chatTyping.deleteMany({
      where: { sessionId, channel: parsed.data.channel },
    });
  }

  const author = parsed.data.author?.trim() || "Anonyme";
  if (author !== "Anonyme" || parsed.data.sessionId) {
    await prisma.notification.create({
      data: {
        userId: null,
        type: "chat",
        title: `Nouveau message dans ${parsed.data.channel}`,
        body: `${author} : ${parsed.data.content.slice(0, 80)}`,
        link: "/hub",
      },
    });
  }

  return NextResponse.json({
    message: { ...message, createdAt: message.createdAt.toISOString() },
  });
}
