import { SettingsForm } from "@/components/SettingsForm";
import { getSession } from "@/lib/auth";
import { parsePreferences } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ParametresPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { preferences: true },
  });

  const preferences = parsePreferences(user?.preferences ?? "{}");

  return (
    <div className="settings-page">
      <header className="feed-page-header">
        <h1>Paramètres</h1>
        <p>Gérez votre profil et vos préférences sur le portail.</p>
      </header>

      <article className="feed-card settings-card">
        <h2>Profil</h2>
        <div className="settings-form">
          <label>
            Nom
            <input type="text" value={session.name} disabled />
          </label>
          <label>
            Email
            <input type="email" value={session.email} disabled />
          </label>
          <label>
            Département
            <input type="text" value={session.department || "—"} disabled />
          </label>
          <label>
            Rôle
            <input type="text" value={session.role} disabled />
          </label>
        </div>
        <p className="settings-hint">
          La modification du profil est gérée par l&apos;annuaire interne / RH.
        </p>
      </article>

      <SettingsForm initial={preferences} />
    </div>
  );
}
