import Link from "next/link";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { MessengerChat } from "@/components/messenger/MessengerChat";

export default async function MessageriePage() {
  const session = await getSession();
  const showMod = session ? isRhOrAdmin(session.role) : false;

  return (
    <div className="messagerie-fullscreen">
      <header className="feed-page-header messagerie-full-header">
        <div>
          <h1>Messagerie VALUE-IT</h1>
          <p>Salon anonyme — aucune connexion obligatoire.</p>
        </div>
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Retour à l&apos;accueil
        </Link>
      </header>
      <div className="messagerie-full-frame feed-card">
        <MessengerChat variant="fullscreen" showModeration={showMod} />
      </div>
    </div>
  );
}
