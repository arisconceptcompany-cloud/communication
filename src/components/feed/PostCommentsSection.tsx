"use client";

import { useState } from "react";
import type { FeedComment } from "@/lib/feed";
import { getAnonymousIdentity } from "@/lib/anonymous-identity";
import { timeAgo } from "@/lib/time-ago";
import { PostAvatar } from "./PostAvatar";

type Props = {
  postId: string;
  comments: FeedComment[];
  allowAnonymous: boolean;
  onCommentsChange: (c: FeedComment[]) => void;
};

function CommentNode({
  comment,
  postId,
  allowAnonymous,
  onCommentAdded,
  depth = 0,
}: {
  comment: FeedComment;
  postId: string;
  allowAnonymous: boolean;
  onCommentAdded: (c: FeedComment) => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);

  const displayName = comment.isAnonymous
    ? (comment.anonymousLabel ?? "Anonyme")
    : comment.author.name;
  const dept = comment.isAnonymous ? null : comment.author.department;

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/annonces/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody.trim(), parentId: comment.id }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    onCommentAdded(data.comment);
    setReplyBody("");
    setReplying(false);
  }

  return (
    <div className={`post-comment ${depth > 0 ? "post-comment--reply" : ""}`}>
      <PostAvatar name={displayName} size={depth > 0 ? 28 : 32} />
      <div className="post-comment-body">
        <p className="post-comment-author">
          <strong>{displayName}</strong>
          {dept && <span className="post-comment-dept"> ({dept})</span>}
        </p>
        <p className="post-comment-text">{comment.body}</p>
        <div className="post-comment-actions">
          <button type="button" className="post-comment-action">
            J&apos;aime
          </button>
          <button
            type="button"
            className="post-comment-action"
            onClick={() => setReplying((v) => !v)}
          >
            Répondre
          </button>
          <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
        </div>
        {replying && (
          <form className="post-comment-reply-form" onSubmit={submitReply}>
            <input
              type="text"
              placeholder="Votre réponse…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              disabled={busy}
            />
            <button type="submit" className="btn btn-fb btn-sm" disabled={busy}>
              Envoyer
            </button>
          </form>
        )}
        {comment.replies.map((r) => (
          <CommentNode
            key={r.id}
            comment={r}
            postId={postId}
            allowAnonymous={allowAnonymous}
            onCommentAdded={onCommentAdded}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
}

export function PostCommentsSection({
  postId,
  comments: initial,
  allowAnonymous,
  onCommentsChange,
}: Props) {
  const [comments, setComments] = useState(initial);
  const [commentBody, setCommentBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sort, setSort] = useState<"relevant" | "recent">("relevant");
  const [busy, setBusy] = useState(false);

  function addComment(comment: FeedComment) {
    if (comment.parentId) {
      const next = appendReply(comments, comment);
      setComments(next);
      onCommentsChange(next);
    } else {
      const next = [...comments, comment];
      setComments(next);
      onCommentsChange(next);
    }
  }

  function appendReply(list: FeedComment[], reply: FeedComment): FeedComment[] {
    return list.map((c) => {
      if (c.id === reply.parentId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      if (c.replies.length) {
        return { ...c, replies: appendReply(c.replies, reply) };
      }
      return c;
    });
  }

  const sorted = [...comments].sort((a, b) => {
    if (sort === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.replies.length - a.replies.length;
  });

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() || busy) return;
    setBusy(true);
    const anon = anonymous && allowAnonymous ? getAnonymousIdentity() : null;
    const res = await fetch(`/api/annonces/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: commentBody.trim(),
        isAnonymous: Boolean(anon),
        anonymousLabel: anon?.label,
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    addComment(data.comment);
    setCommentBody("");
  }

  const totalComments =
    comments.length +
    comments.reduce((n, c) => n + c.replies.length, 0);

  return (
    <section className="post-comments-section">
      <div className="post-comments-filter">
        📑 Filtrer :{" "}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "relevant" | "recent")}
        >
          <option value="relevant">Les plus pertinents</option>
          <option value="recent">Les plus récents</option>
        </select>
        <span className="post-comments-count">
          {totalComments} commentaire{totalComments > 1 ? "s" : ""}
        </span>
      </div>

      {sorted.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          postId={postId}
          allowAnonymous={allowAnonymous}
          onCommentAdded={addComment}
        />
      ))}

      <form className="post-comment-composer" onSubmit={submitComment}>
        <p className="post-comment-composer-label">✍️ Écrivez un commentaire…</p>
        <textarea
          rows={2}
          placeholder="Votre message…"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          disabled={busy}
        />
        <div className="post-comment-composer-tools">
          <span className="post-comment-tool" title="Bientôt">📷 Photo</span>
          <span className="post-comment-tool" title="Bientôt">GIF</span>
          <span className="post-comment-tool" title="Bientôt">😀</span>
          <span className="post-comment-tool" title="Bientôt">📎 PDF</span>
          {allowAnonymous && (
            <label className="post-comment-anon">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              🕶️ Mode anonyme
            </label>
          )}
          <button
            type="submit"
            className="btn btn-fb btn-sm"
            disabled={busy || !commentBody.trim()}
          >
            Publier
          </button>
        </div>
      </form>
    </section>
  );
}
