import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sessionId: z.string().min(1).max(40),
});

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalide" }, { status: 400 });
  }

  const message = await prisma.chatMessage.findUnique({ where: { id } });
  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }

  if (message.sessionId !== parsed.data.sessionId) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres messages" }, { status: 403 });
  }

  if (message.createdAt < new Date(Date.now() - 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Délai de 10 minutes dépassé pour la suppression" }, { status: 400 });
  }

  await prisma.chatMessage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
