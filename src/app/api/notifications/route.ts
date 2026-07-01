import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deleteSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
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
    include: {
      recipients: {
        where: { userId: session.id },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const result = notifications.map((n) => ({
    ...n,
    read: n.recipients[0]?.read ?? false,
  }));

  const count = result.length;

  return NextResponse.json({ notifications: result, count });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  let ids: string[] = [];

  if (parsed.data.all) {
    const visible = await prisma.notification.findMany({
      where: {
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
            some: { userId: session.id, deleted: true },
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
          create: { notificationId: id, userId: session.id, deleted: true },
          update: { deleted: true },
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}
