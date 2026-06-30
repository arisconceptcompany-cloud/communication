import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  department: z.string().min(1, "Le département est requis").optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.orgNode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }

  try {
    const node = await prisma.orgNode.update({ where: { id }, data: parsed.data });
    return NextResponse.json(node);
  } catch (err) {
    console.error("Erreur mise à jour org node:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.orgNode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }

  try {
    async function deleteRecursive(nodeId: string) {
      const children = await prisma.orgNode.findMany({ where: { parentId: nodeId }, select: { id: true } });
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      await prisma.orgNode.delete({ where: { id: nodeId } });
    }
    await deleteRecursive(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur suppression org node:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
