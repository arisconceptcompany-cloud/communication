import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.deletedAt) {
    return NextResponse.json(
      { error: "Publication introuvable" },
      { status: 404 }
    );
  }

  const existing = await prisma.postSave.findUnique({
    where: { userId_postId: { userId: session.id, postId: id } },
  });

  if (existing) {
    await prisma.postSave.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.postSave.create({
    data: { userId: session.id, postId: id },
  });

  return NextResponse.json({ saved: true });
}
