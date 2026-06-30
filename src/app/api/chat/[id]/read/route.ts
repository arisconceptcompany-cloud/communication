import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sessionId: z.string().min(1).max(40),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  await prisma.chatRead.upsert({
    where: {
      messageId_sessionId: { messageId: id, sessionId: parsed.data.sessionId },
    },
    create: { messageId: id, sessionId: parsed.data.sessionId },
    update: {},
  });

  const readCount = await prisma.chatRead.count({ where: { messageId: id } });
  return NextResponse.json({ readCount });
}
