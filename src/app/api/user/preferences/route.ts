import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { mergePreferences, parsePreferences } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  emailNotifications: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { preferences: true },
  });

  return NextResponse.json({
    preferences: parsePreferences(user?.preferences ?? "{}"),
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { preferences: true },
  });

  const preferences = mergePreferences(
    user?.preferences ?? "{}",
    parsed.data
  );

  await prisma.user.update({
    where: { id: session.id },
    data: { preferences },
  });

  return NextResponse.json({
    preferences: parsePreferences(preferences),
  });
}
