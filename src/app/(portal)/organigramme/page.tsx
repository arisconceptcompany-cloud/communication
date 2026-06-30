import { OrgChart } from "@/components/OrgChart";
import { getOrgTree } from "@/lib/org";
import { getSession, isRhOrAdmin } from "@/lib/auth";

export default async function OrganigrammePage() {
  const [tree, session] = await Promise.all([getOrgTree(), getSession()]);
  const canEdit = session ? isRhOrAdmin(session.role) : false;

  return (
    <>
      <header className="feed-page-header">
        <h1>Organigramme</h1>
        <p>
          Trombinoscope interactif VALUE-IT — cliquez sur un collègue pour voir
          son profil. Contact RH : contact@value-it.mg
        </p>
      </header>
      <article className="feed-card">
        <OrgChart nodes={tree} canEdit={canEdit} />
      </article>
    </>
  );
}
