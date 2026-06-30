import { prisma } from "@/lib/prisma";

export async function getRhAnnouncementStats() {
  const [totalPosts, pinnedPosts, totalReactions, totalUsers] =
    await Promise.all([
      prisma.announcement.count({ where: { published: true } }),
      prisma.announcement.count({ where: { published: true, pinned: true } }),
      prisma.postReaction.count(),
      prisma.user.count(),
    ]);

  const readRate =
    totalUsers > 0
      ? Math.min(100, Math.round((totalReactions / totalUsers) * 100))
      : 0;

  return {
    totalPosts,
    pinnedPosts,
    totalReactions,
    readRate,
  };
}
