import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["nouveau", "en_cours", "traite", "archive"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const existing = await prisma.rhSubmission.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  await prisma.rhSubmission.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
