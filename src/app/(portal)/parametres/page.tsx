import { SettingsForm } from "@/components/SettingsForm";
import { getSession } from "@/lib/auth";
import { parsePreferences } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { User } from "lucide-react";

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

      <article className="feed-card settings-card settings-left">
        <div className="settings-section-header">
          <span className="settings-section-icon">
            <User size={20} />
          </span>
          <span className="settings-section-title">Profil</span>
        </div>
        <div className="settings-form-grid">
          <div className="settings-profile-field">
            <span className="label">Nom</span>
            <span className="value">{session.name}</span>
          </div>
          <div className="settings-profile-field">
            <span className="label">Email</span>
            <span className="value">{session.email}</span>
          </div>
          <div className="settings-profile-field">
            <span className="label">Département</span>
            <span className="value">{session.department || "—"}</span>
          </div>
          <div className="settings-profile-field">
            <span className="label">Rôle</span>
            <span className="value">{session.role}</span>
          </div>
        </div>
        <p className="settings-hint">
          La modification du profil est gérée par l&apos;annuaire interne / RH.
        </p>
      </article>

      <SettingsForm initial={preferences} user={session} />
    </div>
  );
}
