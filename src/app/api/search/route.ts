import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ colleagues: [], announcements: [] });
  }

  const [colleagues, announcements] = await Promise.all([
    prisma.orgNode.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { title: { contains: q } },
          { email: { contains: q } },
          { department: { contains: q } },
        ],
      },
      take: 8,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        title: true,
        department: true,
        email: true,
      },
    }),
    prisma.announcement.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q } },
          { body: { contains: q } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    colleagues,
    announcements: announcements.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
