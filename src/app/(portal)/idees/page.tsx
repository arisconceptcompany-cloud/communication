import { IdeaForm } from "@/components/IdeaForm";

export default function IdeesPage() {
  return (
    <>
      <header className="page-header">
        <h1>Boîte à idées</h1>
        <p>
          Proposez vos idées en toute confidentialité. Les messages sont transmis
          aux adresses email définies par l&apos;équipe RH et la direction.
        </p>
      </header>
      <article className="card">
        <IdeaForm />
      </article>
    </>
  );
}
