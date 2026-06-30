import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.announcement.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const post = await prisma.announcement.update({
    where: { id },
    data: { linkClicks: { increment: 1 } },
    select: { linkClicks: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json({ linkClicks: post.linkClicks });
}
