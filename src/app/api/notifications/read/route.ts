import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  let ids: string[] = [];

  if (parsed.data.all) {
    const visible = await prisma.notification.findMany({
      where: {
        read: false,
        AND: [
          {
            OR: [
              { creatorId: null },
              { creatorId: { not: session.id } },
            ],
          },
          {
            OR: [
              { userId: session.id },
              { userId: null },
            ],
          },
        ],
        NOT: {
          recipients: {
            some: {
              userId: session.id,
              OR: [{ read: true }, { deleted: true }],
            },
          },
        },
      },
      select: { id: true },
    });
    ids = visible.map((n) => n.id);
  } else if (parsed.data.ids?.length) {
    ids = parsed.data.ids;
  }

  if (ids.length > 0) {
    await prisma.$transaction(
      ids.map((id) =>
        prisma.notificationRecipient.upsert({
          where: {
            notificationId_userId: { notificationId: id, userId: session.id },
          },
          create: { notificationId: id, userId: session.id, read: true },
          update: { read: true },
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}
