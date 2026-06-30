import { prisma } from "@/lib/prisma";
import { getRhAnnouncementStats } from "@/lib/rh-stats";

const FOLDER_CATEGORIES = ["paie", "mutuelle", "planning", "document"];

export async function getRhPageData(session: { id: string; role: string }) {
  const isRh = session.role === "RH" || session.role === "ADMIN";

  const [submissions, ideas, folders, stats] = await Promise.all([
    isRh
      ? prisma.rhSubmission.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            submitter: { select: { name: true, email: true } },
          },
        })
      : Promise.resolve([]),
    isRh
      ? prisma.ideaSubmission.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
        })
      : Promise.resolve([]),
    prisma.hubDocument.findMany({
      where: { category: { in: FOLDER_CATEGORIES } },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
    isRh ? getRhAnnouncementStats() : Promise.resolve(null),
  ]);

  return { submissions, ideas, folders, stats, isRh };
}
