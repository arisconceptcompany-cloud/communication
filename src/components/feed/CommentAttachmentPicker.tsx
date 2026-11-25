"use client";

import { useState } from "react";
import {
  COMMENT_DOCUMENT_EXTENSIONS,
  COMMENT_IMAGE_EXTENSIONS,
} from "@/lib/comment-attachments";

export type CommentAttachment = {
  imageUrl: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
};

const EMPTY_ATTACHMENT: CommentAttachment = {
  imageUrl: null,
  attachmentUrl: null,
  attachmentName: null,
};

export function hasCommentAttachment(attachment: CommentAttachment): boolean {
  return Boolean(attachment.imageUrl || attachment.attachmentUrl);
}

/** Upload d'une pièce jointe de commentaire, réservé aux utilisateurs connectés. */
export function useCommentAttachment(postId: string) {
  const [attachment, setAttachment] =
    useState<CommentAttachment>(EMPTY_ATTACHMENT);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/annonces/${postId}/comments/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Envoi du fichier impossible");
      }
      setAttachment({
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
        attachmentUrl:
          typeof data.attachmentUrl === "string" ? data.attachmentUrl : null,
        attachmentName:
          typeof data.attachmentName === "string"
            ? data.attachmentName
            : file.name,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Envoi du fichier impossible"
      );
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setAttachment(EMPTY_ATTACHMENT);
    setError(null);
  }

  return { attachment, uploading, error, upload, clear };
}

type PickerProps = {
  attachment: CommentAttachment;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => void | Promise<void>;
  onClear: () => void;
  disabled?: boolean;
};

export function CommentAttachmentPicker({
  attachment,
  uploading,
  error,
  onUpload,
  onClear,
  disabled = false,
}: PickerProps) {
  const locked = disabled || uploading;
  const attached = hasCommentAttachment(attachment);

  return (
    <>
      <label
        className={`post-comment-tool${locked ? " post-comment-tool--disabled" : ""}`}
        title="Ajouter une photo (JPG, PNG, WEBP)"
      >
        📷 Photo
        <input
          type="file"
          accept={COMMENT_IMAGE_EXTENSIONS.join(",")}
          disabled={locked}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onUpload(file);
          }}
        />
      </label>
      <label
        className={`post-comment-tool${locked ? " post-comment-tool--disabled" : ""}`}
        title="Ajouter un fichier (PDF, DOC, XLS)"
      >
        📎 Fichier
        <input
          type="file"
          accept={COMMENT_DOCUMENT_EXTENSIONS.join(",")}
          disabled={locked}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onUpload(file);
          }}
        />
      </label>
      {uploading && <span className="post-comment-tool">Envoi…</span>}
      {attached && (
        <span className="post-comment-attachment-chip">
          <span>
            {attachment.imageUrl
              ? "🖼️ Photo prête"
              : `📎 ${attachment.attachmentName ?? "Fichier prêt"}`}
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={locked}
            aria-label="Retirer la pièce jointe"
          >
            ×
          </button>
        </span>
      )}
      {error && (
        <span className="post-comment-upload-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
