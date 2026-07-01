import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      read: false,
      NOT: { creatorId: session.id },
      OR: [
        { userId: session.id },
        { userId: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const count = notifications.length;

  return NextResponse.json({ notifications, count });
}
