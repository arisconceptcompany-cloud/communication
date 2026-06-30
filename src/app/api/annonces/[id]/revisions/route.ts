import { NextResponse } from "next/server";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const revisions = await prisma.postRevision.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
    include: { editor: { select: { name: true } } },
  });

  return NextResponse.json({
    revisions: revisions.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      editorName: r.editor.name,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
