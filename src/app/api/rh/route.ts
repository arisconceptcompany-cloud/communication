import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(3).max(200),
  category: z.string().min(1),
  priority: z.string().min(1),
  body: z.string().min(20),
  attachments: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire incomplet" }, { status: 400 });
  }

  await prisma.rhSubmission.create({
    data: {
      ...parsed.data,
      attachments: parsed.data.attachments || null,
      submitterId: session.id,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !(session.role === "RH" || session.role === "ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "submissions";

  try {
    switch (type) {
      case "submissions":
        const submissions = await prisma.rhSubmission.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            submitter: { select: { name: true, email: true } },
          },
        });
        return NextResponse.json(submissions);

      case "ideas":
        const ideas = await prisma.ideaSubmission.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
        });
        return NextResponse.json(ideas);

      case "stats":
        const [totalPosts, pinnedPosts, totalReactions, newSubmissions, ideaCount] = await Promise.all([
          prisma.announcement.count({ where: { published: true } }),
          prisma.announcement.count({ where: { published: true, pinned: true } }),
          prisma.postReaction.count(),
          prisma.rhSubmission.count({ where: { status: "nouveau" } }),
          prisma.ideaSubmission.count(),
        ]);
        const stats = {
          totalPosts,
          pinnedPosts,
          totalReactions,
          newSubmissions,
          ideaCount,
        };
        return NextResponse.json(stats);

      default:
        return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}