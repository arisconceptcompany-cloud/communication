import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgTree } from "@/lib/org";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  department: z.string().min(1, "Le département est requis"),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const tree = await getOrgTree();
    return NextResponse.json(tree);
  } catch (err) {
    console.error("Erreur récupération organigramme:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire incomplet", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, title, email, department, parentId, sortOrder } = parsed.data;

  try {
    const node = await prisma.orgNode.create({
      data: { name, title: title ?? null, email: email ?? null, department, parentId: parentId ?? null, sortOrder: sortOrder ?? 0 },
    });
    return NextResponse.json(node, { status: 201 });
  } catch (err) {
    console.error("Erreur création org node:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
