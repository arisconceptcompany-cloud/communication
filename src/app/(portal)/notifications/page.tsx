import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotificationsList } from "@/components/NotificationsList";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: {
      AND: [
        {
          OR: [
            { creatorId: null },
            { creatorId: { not: session.id } },
          ],
        },
        {
          OR: [
            { userId: session.id },
            { userId: null },
          ],
        },
      ],
      NOT: {
        recipients: {
          some: { userId: session.id, deleted: true },
        },
      },
    },
    include: {
      recipients: {
        where: { userId: session.id },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const mapped = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.recipients[0]?.read ?? n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NotificationsList initial={mapped} />;
}
