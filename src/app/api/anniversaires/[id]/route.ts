import { NextResponse } from "next/server";
import { birthdayInputSchema } from "@/lib/anniversaires";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const PUBLIC_FIELDS = {
  id: true,
  matricule: true,
  fullName: true,
  birthDate: true,
} as const;

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.employeeBirthday.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Employé introuvable" },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = birthdayInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const duplicate = await prisma.employeeBirthday.findFirst({
    where: { matricule: parsed.data.matricule, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "Ce matricule existe déjà" },
      { status: 409 }
    );
  }

  const updated = await prisma.employeeBirthday.update({
    where: { id },
    data: parsed.data,
    select: PUBLIC_FIELDS,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.employeeBirthday.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Employé introuvable" },
      { status: 404 }
    );
  }

  await prisma.employeeBirthday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
