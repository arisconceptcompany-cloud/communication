import { FeedPage } from "@/components/feed/FeedPage";

export default function AnnoncesPage() {
  return (
    <FeedPage
      title="Annonces internes"
      subtitle="Publiez et consultez les annonces internes — réservé aux collaborateurs connectés"
      showComposer
    />
  );
}
