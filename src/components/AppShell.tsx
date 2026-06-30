import { TopBar } from "./TopBar";
import { ThemeInit } from "./ThemeInit";
import { getSession } from "@/lib/auth";
import { parsePreferences } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const userPrefs = session
    ? await prisma.user.findUnique({
        where: { id: session.id },
        select: { preferences: true },
      })
    : null;
  const theme = parsePreferences(userPrefs?.preferences ?? "{}").theme ?? "light";

  const notificationCount = session
    ? await prisma.announcement.count({
        where: {
          published: true,
          pinned: true,
          category: { in: ["rh", "urgent", "general"] },
        },
      })
    : 0;

  return (
    <section className="fb-shell">
      <ThemeInit theme={theme} />
      <TopBar user={session} notificationCount={notificationCount} />
      <main className="fb-main">{children}</main>
    </section>
  );
}
