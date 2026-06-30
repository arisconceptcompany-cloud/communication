"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FeedComment, FeedPost } from "@/lib/feed";
import { isRhOrAdmin } from "@/lib/roles";
import { REACTION_TYPES, reactionEmoji } from "@/lib/reactions";
import { timeAgo } from "@/lib/time-ago";
import type { Role } from "@prisma/client";
import { PostAvatar } from "./PostAvatar";
import { TypologyBadge } from "./TypologyBadge";
import { PostMediaGallery } from "./PostMediaGallery";
import { PostPollWidget } from "./PostPollWidget";
import { PostMenu } from "./PostMenu";
import { PostCommentsSection } from "./PostCommentsSection";
import { PostViewTracker } from "./PostViewTracker";
import { CalendarDays, ChartColumn, Clock3, Download, MessageCircleMore, MousePointer2, Repeat2, TrendingUp, Users } from "lucide-react";

type Props = {
  post: FeedPost;
  currentUser?: { id: string; role: Role } | null;
};

function linkifyBody(body: string, onLinkClick: () => void) {
  const parts = body.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^(https?:\/\/|www\.)/.test(part)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkClick}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function formatTaggedLine(
  authorName: string,
  tagged: FeedPost["taggedUsers"],
  mood: string | null
) {
  const parts: string[] = [];
  if (tagged.length === 1) {
    parts.push(`avec ${tagged[0].name}`);
  } else if (tagged.length === 2) {
    parts.push(`avec ${tagged[0].name} et ${tagged[1].name}`);
  } else if (tagged.length > 2) {
    parts.push(
      `avec ${tagged[0].name} et ${tagged.length - 1} autres personnes`
    );
  }
  if (mood) parts.push(`— 💼 ${mood}`);
  return parts.join(" ");
}

export function PostCard({ post, currentUser }: Props) {
  const router = useRouter();
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [reactionSummary, setReactionSummary] = useState(post.reactionSummary);
  const [userReaction, setUserReaction] = useState(post.userReaction);
  const [saved, setSaved] = useState(post.userSaved);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [revisions, setRevisions] = useState<
    { title: string; body: string; editorName: string; createdAt: string }[]
  >([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [allowComments, setAllowComments] = useState(post.allowComments);
  const [busy, setBusy] = useState(false);

  const isOfficialRh =
    post.author.role === "RH" || post.author.role === "ADMIN";
  const isMod = currentUser && isRhOrAdmin(currentUser.role);
  const canManage =
    currentUser &&
    (currentUser.id === post.author.id || isRhOrAdmin(currentUser.role));

  const totalComments =
    comments.length + comments.reduce((n, c) => n + c.replies.length, 0);

  useEffect(() => {
    setComments(post.comments);
  }, [post.comments]);

  async function react(type: string) {
    if (!post.allowReactions || busy) return;
    setBusy(true);
    const res = await fetch(`/api/annonces/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setReactionCount(data.reactionCount);
    setUserReaction(data.userReaction);
    setReactionSummary(data.reactionSummary);
    setShowReactions(false);
  }

  async function trackLinkClick() {
    await fetch(`/api/annonces/${post.id}/click`, { method: "POST" });
  }

  async function toggleSave() {
    const res = await fetch(`/api/annonces/${post.id}/save`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setSaved(data.saved);
  }

  async function sharePost() {
    const url = `${window.location.origin}/annonces#post-${post.id}`;
    await navigator.clipboard.writeText(url);
    const res = await fetch(`/api/annonces/${post.id}/share`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setShareCount(data.shareCount);
    }
    alert("Lien copié dans le presse-papiers !");
  }

  async function deletePost() {
    if (!canManage || !confirm("Déplacer cette publication vers la corbeille ?"))
      return;
    setBusy(true);
    const res = await fetch(`/api/annonces/${post.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function saveEdit() {
    setBusy(true);
    const res = await fetch(`/api/annonces/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function pin() {
    await fetch(`/api/annonces/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: true }),
    });
    router.refresh();
  }

  async function unpin() {
    await fetch(`/api/annonces/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: false }),
    });
    router.refresh();
  }

  async function toggleCommentsSetting() {
    const res = await fetch(`/api/annonces/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowComments: !allowComments }),
    });
    if (res.ok) setAllowComments((v) => !v);
  }

  async function loadRevisions() {
    const res = await fetch(`/api/annonces/${post.id}/revisions`);
    if (!res.ok) return;
    const data = await res.json();
    setRevisions(data.revisions);
    setShowRevisions(true);
  }

  const reactionLabel = userReaction
    ? REACTION_TYPES.find((r) => r.id === userReaction)?.label ?? "J'aime"
    : "J'aime";

  const visibility = post.targetDepartment
    ? `Département ${post.targetDepartment}`
    : "Tout VALUE-IT";

  return (
    <article className="feed-card post-card post-card--fb" id={`post-${post.id}`}>
      {currentUser && <PostViewTracker postId={post.id} />}

      {(post.pinned || post.targetDepartment) && (
        <div className="post-context-bar">
          {post.pinned && <span>📌 Épinglé en haut</span>}
          {post.pinned && post.targetDepartment && <span> • </span>}
          {post.targetDepartment && (
            <span>🎯 Ciblage : {post.targetDepartment}</span>
          )}
          <span> • 🌏 Visibilité : {visibility}</span>
        </div>
      )}

      <header className="post-card-header">
        <PostAvatar name={post.author.name} />
        <div className="post-card-header-main">
          <div className="post-card-author-row">
            <strong className="post-card-author">
              {isOfficialRh ? "📢 VALUE-IT Ressources Humaines" : post.author.name}
            </strong>
            {isOfficialRh && (
              <span className="post-badge post-badge--verified">✓ Vérifié</span>
            )}
            {post.author.role === "ADMIN" && (
              <span className="post-badge post-badge--admin">👑 Administrateur</span>
            )}
            <span className="post-card-time"><CalendarDays size={18}/> {timeAgo(post.createdAt)}</span>

          </div>
          {(post.taggedUsers.length > 0 || post.moodActivity) && (
            <p className="post-card-with">
              {formatTaggedLine(
                post.author.name,
                post.taggedUsers,
                post.moodActivity
              )}
            </p>
          )}
          <p className="post-card-meta">
            <TypologyBadge category={post.category} />
            {post.location && <> · 📍 {post.location}</>}
          </p>
        </div>
        {currentUser && (
          <PostMenu
            post={post}
            currentUser={currentUser}
            saved={saved}
            onSave={toggleSave}
            onEdit={() => setEditing(true)}
            onDelete={deletePost}
            onToggleComments={toggleCommentsSetting}
            onPin={pin}
            onUnpin={unpin}
            onShowRevisions={loadRevisions}
          />
        )}
      </header>

      {editing ? (
        <div className="post-edit-form">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="post-edit-title"
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="post-edit-body"
            rows={5}
          />
          <div className="post-edit-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditing(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveEdit}
              disabled={busy}
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="post-card-title">
            {isOfficialRh && (
              <span className="badge-official">OFFICIEL — RH</span>
            )}{" "}
            {post.title}
          </h2>
          <p className="post-card-body">
            {linkifyBody(post.body, trackLinkClick)}
          </p>
        </>
      )}

      {post.attachmentUrl && (
        <a
          href={post.attachmentUrl}
          className="post-attachment"
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackLinkClick}
        >
          📎 Note de service / pièce jointe officielle
        </a>
      )}

      <PostMediaGallery
        imageUrl={post.imageUrl}
        videoUrl={post.videoUrl}
        mediaGallery={post.mediaGallery}
      />

      {post.poll && <PostPollWidget postId={post.id} poll={post.poll} />}

      {isMod && (
        <section className="post-admin-stats">
          <span className="post-admin-stats-label">
            <ChartColumn size={19}/> Stats (RH / Admin)
          </span>
          <div className="post-admin-stats-grid">
            <span><Users size={19}/> {post.viewCount} personnes touchées</span>
            <span>
              <TrendingUp size={19}/> {reactionCount + totalComments} interactions
            </span>
            <span><MousePointer2 size={19}/> {post.linkClicks} clics sur les liens</span>
          </div>
        </section>
      )}

      <div className="post-card-stats">
        <span className="post-reaction-summary">
          {reactionSummary.length > 0 && (
            <>
              {reactionSummary.map((r) => (
                <span key={r.type} className="post-reaction-emoji">
                  {reactionEmoji(r.type)}
                </span>
              ))}{" "}
              {reactionCount} réaction{reactionCount > 1 ? "s" : ""}
            </>
          )}
        </span>
        <span>
          {totalComments > 0 && (
            <button
              type="button"
              className="post-card-stats-comments"
              onClick={() => setShowComments(true)}
            >
              {totalComments} commentaire{totalComments > 1 ? "s" : ""}
            </button>
          )}
          {shareCount > 0 && (
            <> · {shareCount} partage{shareCount > 1 ? "s" : ""}</>
          )}
        </span>
      </div>

      <div className="post-card-actions post-card-actions--fb">
        <div
          className="post-reaction-wrap"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {showReactions && post.allowReactions && (
            <div className="post-reaction-picker">
              {REACTION_TYPES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  title={r.label}
                  onClick={() => react(r.id)}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`post-card-action ${
              userReaction ? "post-card-action--active" : ""
            }`}
            onClick={() => react(userReaction ?? "like")}
            disabled={!post.allowReactions || busy}
          >
            {userReaction ? reactionEmoji(userReaction) : "👍"}{" "}
            {reactionLabel}
          </button>
        </div>
        <button
          type="button"
          className="post-card-action"
          onClick={() => setShowComments((v) => !v)}
          disabled={!allowComments}
        >
          <MessageCircleMore size={18} /> Commenter
        </button>
        <button
          type="button"
          className="post-card-action"
          onClick={sharePost}
        >
          <Repeat2 size={18} /> Partager
        </button>
        <button
          type="button"
          className={`post-card-action ${saved ? "post-card-action--active" : ""}`}
          onClick={toggleSave}
        >
          <Download size={18} /> {saved ? "Enregistré" : "Enregistrer"}
        </button>
      </div>

      {showComments && allowComments && currentUser && (
        <PostCommentsSection
          postId={post.id}
          comments={comments}
          allowAnonymous={post.allowAnonymousComments}
          onCommentsChange={setComments}
        />
      )}

      {showRevisions && revisions.length > 0 && (
        <dialog open className="post-revisions-modal">
          <div className="post-revisions-content">
            <h3>Historique des révisions</h3>
            {revisions.map((r, i) => (
              <article key={i} className="post-revision-item">
                <p className="announcement-meta">
                  {r.editorName} ·{" "}
                  {new Date(r.createdAt).toLocaleString("fr-FR")}
                </p>
                <strong>{r.title}</strong>
                <p>{r.body}</p>
              </article>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowRevisions(false)}
            >
              Fermer
            </button>
          </div>
        </dialog>
      )}
    </article>
  );
}
