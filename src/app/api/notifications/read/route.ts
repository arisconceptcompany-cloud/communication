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

  if (parsed.data.all) {
    await prisma.notification.updateMany({
      where: {
        read: false,
        OR: [
          { userId: session.id },
          { userId: null },
        ],
      },
      data: { read: true },
    });
  } else if (parsed.data.ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: parsed.data.ids } },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
