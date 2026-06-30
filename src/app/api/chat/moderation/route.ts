import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const banSchema = z.object({
  sessionId: z.string().optional(),
  ipHash: z.string().optional(),
  reason: z.string().optional(),
  hours: z.number().min(1).max(168).default(24),
});

export async function GET() {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [reports, bans] = await Promise.all([
    prisma.chatReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.chatBan.findMany({
      where: { OR: [{ until: null }, { until: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ reports, bans });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const parsed = banSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  if (!parsed.data.sessionId && !parsed.data.ipHash) {
    return NextResponse.json(
      { error: "sessionId ou ipHash requis" },
      { status: 400 }
    );
  }

  const until = new Date();
  until.setHours(until.getHours() + parsed.data.hours);

  const ban = await prisma.chatBan.create({
    data: {
      sessionId: parsed.data.sessionId ?? null,
      ipHash: parsed.data.ipHash ?? null,
      reason: parsed.data.reason ?? "Modération RH",
      until,
    },
  });

  return NextResponse.json({ ban });
}
