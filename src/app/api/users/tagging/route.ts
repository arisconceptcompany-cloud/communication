import { NextResponse } from "next/server";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  const departments = [
    ...new Set(
      users.map((u) => u.department).filter((d): d is string => Boolean(d))
    ),
  ].sort();

  return NextResponse.json({ users, departments });
}
