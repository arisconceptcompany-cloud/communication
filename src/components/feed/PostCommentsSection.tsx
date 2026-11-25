"use client";

import { useEffect, useState } from "react";
import type { Role } from "@prisma/client";
import type { FeedComment } from "@/lib/feed";
import { getAnonymousIdentity } from "@/lib/anonymous-identity";
import { commentFileIcon } from "@/lib/comment-attachments";
import { TimeAgo } from "@/components/TimeAgo";
import { PostAvatar } from "./PostAvatar";
import {
  CommentAttachmentPicker,
  hasCommentAttachment,
  useCommentAttachment,
} from "./CommentAttachmentPicker";

type CurrentUser = { id: string; role: Role };

type Props = {
  postId: string;
  comments: FeedComment[];
  allowAnonymous: boolean;
  currentUser: CurrentUser;
  onCommentsChange: (c: FeedComment[]) => void;
};

function displayName(comment: FeedComment): string {
  return comment.isAnonymous
    ? (comment.anonymousLabel ?? "Anonyme")
    : comment.author.name;
}

function canDelete(comment: FeedComment, user: CurrentUser): boolean {
  return (
    comment.author.id === user.id ||
    user.role === "ADMIN" ||
    user.role === "RH"
  );
}

function countComments(list: FeedComment[]): number {
  return list.reduce((total, c) => total + 1 + countComments(c.replies), 0);
}

function removeComment(list: FeedComment[], id: string): FeedComment[] {
  return list
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: removeComment(c.replies, id) }));
}

function CommentAttachments({ comment }: { comment: FeedComment }) {
  if (!comment.imageUrl && !comment.attachmentUrl) return null;

  return (
    <div className="post-comment-attachments">
      {comment.imageUrl && (
        <a
          className="post-comment-image-link"
          href={comment.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={comment.imageUrl}
            alt="Photo du commentaire"
            loading="lazy"
          />
        </a>
      )}
      {comment.attachmentUrl && (
        <a
          className="post-comment-file"
          href={comment.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {commentFileIcon(comment.attachmentName)}{" "}
          {comment.attachmentName ?? "Télécharger le fichier"}
        </a>
      )}
    </div>
  );
}

function CommentNode({
  comment,
  postId,
  allowAnonymous,
  currentUser,
  onCommentAdded,
  onRequestDelete,
  depth = 0,
}: {
  comment: FeedComment;
  postId: string;
  allowAnonymous: boolean;
  currentUser: CurrentUser;
  onCommentAdded: (c: FeedComment) => void;
  onRequestDelete: (c: FeedComment) => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const reply = useCommentAttachment(postId);

  const authorName = displayName(comment);
  const dept = comment.isAnonymous ? null : comment.author.department;
  const canSubmitReply =
    !busy &&
    !reply.uploading &&
    (Boolean(replyBody.trim()) || hasCommentAttachment(reply.attachment));

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitReply) return;
    setBusy(true);
    const res = await fetch(`/api/annonces/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: replyBody.trim(),
        parentId: comment.id,
        imageUrl: reply.attachment.imageUrl,
        attachmentUrl: reply.attachment.attachmentUrl,
        attachmentName: reply.attachment.attachmentName,
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    onCommentAdded(data.comment);
    setReplyBody("");
    reply.clear();
    setReplying(false);
  }

  return (
    <div className={`post-comment ${depth > 0 ? "post-comment--reply" : ""}`}>
      <PostAvatar name={authorName} size={depth > 0 ? 28 : 32} />
      <div className="post-comment-body">
        <p className="post-comment-author">
          <strong>{authorName}</strong>
          {dept && <span className="post-comment-dept"> ({dept})</span>}
        </p>
        {comment.body && <p className="post-comment-text">{comment.body}</p>}
        <CommentAttachments comment={comment} />
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
          {canDelete(comment, currentUser) && (
            <button
              type="button"
              className="post-comment-action post-comment-action--danger"
              onClick={() => onRequestDelete(comment)}
            >
              Supprimer
            </button>
          )}
          <TimeAgo iso={comment.createdAt} />
        </div>
        {replying && (
          <form className="post-comment-reply-form" onSubmit={submitReply}>
            <input
              type="text"
              placeholder="Votre réponse…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              disabled={busy || reply.uploading}
            />
            <div className="post-comment-composer-tools">
              <CommentAttachmentPicker
                attachment={reply.attachment}
                uploading={reply.uploading}
                error={reply.error}
                onUpload={reply.upload}
                onClear={reply.clear}
                disabled={busy}
              />
              <button
                type="submit"
                className="btn btn-fb btn-sm"
                disabled={!canSubmitReply}
              >
                Envoyer
              </button>
            </div>
          </form>
        )}
        {comment.replies.map((r) => (
          <CommentNode
            key={r.id}
            comment={r}
            postId={postId}
            allowAnonymous={allowAnonymous}
            currentUser={currentUser}
            onCommentAdded={onCommentAdded}
            onRequestDelete={onRequestDelete}
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
  currentUser,
  onCommentsChange,
}: Props) {
  const [comments, setComments] = useState(initial);
  const [commentBody, setCommentBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sort, setSort] = useState<"relevant" | "recent">("relevant");
  const [busy, setBusy] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<FeedComment | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const attachmentState = useCommentAttachment(postId);
  const { attachment } = attachmentState;

  useEffect(() => {
    if (!commentToDelete) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) setCommentToDelete(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commentToDelete, deleting]);

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

  const canSubmit =
    !busy &&
    !attachmentState.uploading &&
    (Boolean(commentBody.trim()) || hasCommentAttachment(attachment));

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const anon = anonymous && allowAnonymous ? getAnonymousIdentity() : null;
    const res = await fetch(`/api/annonces/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: commentBody.trim(),
        isAnonymous: Boolean(anon),
        anonymousLabel: anon?.label,
        imageUrl: attachment.imageUrl,
        attachmentUrl: attachment.attachmentUrl,
        attachmentName: attachment.attachmentName,
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    addComment(data.comment);
    setCommentBody("");
    attachmentState.clear();
  }

  function requestDelete(comment: FeedComment) {
    setDeleteError(null);
    setCommentToDelete(comment);
  }

  async function confirmDelete() {
    if (!commentToDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/annonces/${postId}/comments/${commentToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Suppression impossible");
      const next = removeComment(comments, commentToDelete.id);
      setComments(next);
      onCommentsChange(next);
      setCommentToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Suppression impossible"
      );
    } finally {
      setDeleting(false);
    }
  }

  const totalComments = countComments(comments);

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
          currentUser={currentUser}
          onCommentAdded={addComment}
          onRequestDelete={requestDelete}
        />
      ))}

      <form className="post-comment-composer" onSubmit={submitComment}>
        <p className="post-comment-composer-label">✍️ Écrivez un commentaire…</p>
        <textarea
          rows={2}
          placeholder="Votre message…"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          disabled={busy || attachmentState.uploading}
        />
        <div className="post-comment-composer-tools">
          <CommentAttachmentPicker
            attachment={attachment}
            uploading={attachmentState.uploading}
            error={attachmentState.error}
            onUpload={attachmentState.upload}
            onClear={attachmentState.clear}
            disabled={busy}
          />
          <span className="post-comment-tool" title="Bientôt">😀</span>
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
          <button type="submit" className="btn btn-fb btn-sm" disabled={!canSubmit}>
            Publier
          </button>
        </div>
      </form>

      {commentToDelete && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setCommentToDelete(null);
            }
          }}
        >
          <div
            className="modal-card hub-note-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-comment-title"
          >
            <div className="hub-note-icon" aria-hidden="true">
              🗑️
            </div>
            <h3 id="delete-comment-title">Supprimer le commentaire ?</h3>
            <p>
              Le commentaire de <strong>{displayName(commentToDelete)}</strong>{" "}
              sera supprimé définitivement.
            </p>
            {commentToDelete.replies.length > 0 && (
              <p>
                {countComments(commentToDelete.replies)} réponse
                {countComments(commentToDelete.replies) > 1 ? "s" : ""} seront
                également supprimée{countComments(commentToDelete.replies) > 1 ? "s" : ""}.
              </p>
            )}
            {deleteError && (
              <p className="post-comment-upload-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="modal-actions modal-actions--center">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCommentToDelete(null)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
