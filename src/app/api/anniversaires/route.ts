import { NextResponse } from "next/server";
import { birthdayInputSchema } from "@/lib/anniversaires";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PUBLIC_FIELDS = {
  id: true,
  matricule: true,
  fullName: true,
  birthDate: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const records = await prisma.employeeBirthday.findMany({
    select: PUBLIC_FIELDS,
  });

  // Tri numérique naturel : 48 < 287 < 1023, contrairement au tri texte brut.
  records.sort((a, b) =>
    a.matricule.localeCompare(b.matricule, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = birthdayInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const duplicate = await prisma.employeeBirthday.findUnique({
    where: { matricule: parsed.data.matricule },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "Ce matricule existe déjà" },
      { status: 409 }
    );
  }

  const created = await prisma.employeeBirthday.create({
    data: parsed.data,
    select: PUBLIC_FIELDS,
  });

  return NextResponse.json(created, { status: 201 });
}
