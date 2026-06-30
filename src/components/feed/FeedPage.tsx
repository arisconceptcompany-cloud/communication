import { getSession, isRhOrAdmin } from "@/lib/auth";
import { getFeedPosts } from "@/lib/feed";
import { FeedLeftRail } from "./FeedLeftRail";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";


type Props = {
  title: string;
  subtitle: string;
  showComposer?: boolean;
  layout?: "home" | "simple";
};

export async function FeedPage({
  title,
  subtitle,
  showComposer = false,
  layout = "simple",
}: Props) {
  const session = await getSession();
  const posts = await getFeedPosts(session);
  const isRh = session ? isRhOrAdmin(session.role) : false;
  const canPublish =
    session && isRh && (showComposer || layout === "home");

  const feedCenter = (
    <div className="feed-center">
      {canPublish ? (
        <PostComposer userName={session!.name} />
      ) : layout === "home" ? (
        <section className="feed-card fb-rh-notice">
          <p>
            <strong>Consultez les annonces</strong> — les publications officielles
            RH apparaissent ci-dessous avec le badge{" "}
            <span className="badge-official">OFFICIEL — RH</span>.
          </p>
        </section>
      ) : null}

      {posts.length === 0 ? (
        <section className="feed-card feed-empty">
          <p>Aucune publication pour le moment.</p>
          <p className="feed-empty-hint">
            Les annonces RH et internes apparaîtront ici.
          </p>
        </section>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={
                session ? { id: session.id, role: session.role } : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="feed-page-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      {layout === "home" ? (
        <div className="fb-two-col">
          <FeedLeftRail />
          {feedCenter}
        </div>
      ) : (
        <div className="feed-layout">{feedCenter}</div>
      )}
    </>
  );
}
