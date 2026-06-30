"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Paperclip, Image as ImageIcon, Smile, Mic, Send,
  Minimize2, Maximize2, X, Settings, Lock, Flag,
  Clock, CheckCheck, MessageSquare, Trash2, CornerUpLeft,
} from "lucide-react";
import {
  getAnonymousIdentity,
  getSessionShortId,
  regenerateAnonymousIdentity,
  type AnonymousIdentity,
} from "@/lib/anonymous-identity";
import { CHAT_REACTIONS } from "@/lib/chat-reactions";
import { useMessenger } from "./MessengerContext";

export type ChatMessage = {
  id: string;
  author: string;
  sessionId: string | null;
  content: string | null;
  imageUrl: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
  readCount: number;
  reactions: Record<string, number>;
  myReaction: string | null;
  replyTo?: { id: string; author: string; content: string } | null;
};

type Props = {
  variant?: "sidebar" | "window" | "fullscreen";
  showModeration?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
};

const QUICK_EMOJIS = ["😀", "😂", "❤️", "👍", "🎉", "🔥", "☕", "💡"];

const COLOR_MAP: Record<string, string> = {
  Bleu: "#1877F2",
  Vert: "#16a34a",
  Orange: "#F68A15",
  Violet: "#8B5CF6",
  Rose: "#EC4899",
  Cyan: "#06B6D4",
  Jaune: "#EAB308",
  Rouge: "#EF4444",
  Indigo: "#6366F1",
  Menthe: "#14B8A6",
};

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function MessengerChat({
  variant = "sidebar",
  showModeration = false,
  onClose,
  onMinimize,
}: Props) {
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typing, setTyping] = useState<string[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [hoverMsg, setHoverMsg] = useState<string | null>(null);
  const [modSession, setModSession] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const hiddenForMe = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem("valueit_hidden_msgs") || "[]")));
  const scrollRef = useRef<HTMLDivElement>(null);
  const { maximized, toggleMaximized } = useMessenger();
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readSent = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!identity) return;
    const res = await fetch(
      `/api/chat?channel=general&sessionId=${encodeURIComponent(identity.sessionId)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
    setOnlineCount(data.onlineCount ?? 0);
    setTyping(data.typing ?? []);
  }, [identity]);

  useEffect(() => {
    async function initIdentity() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.session?.id) {
          const storageKey = `valueit_auth_identity_${data.session.id}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as AnonymousIdentity;
              if (parsed.sessionId === `auth_${data.session.id}`) {
                setIdentity({
                  ...parsed,
                  displayName: `${parsed.emoji} ${parsed.label}`,
                });
                return;
              }
            } catch {}
          }
          const identity: AnonymousIdentity = {
            ...regenerateAnonymousIdentity(),
            sessionId: `auth_${data.session.id}`,
          };
          localStorage.setItem(storageKey, JSON.stringify(identity));
          setIdentity({
            ...identity,
            displayName: `${identity.emoji} ${identity.label}`,
          });
          return;
        }
      } catch {}
      setIdentity(getAnonymousIdentity());
    }
    initIdentity();
  }, []);

  useEffect(() => {
    if (!identity) return;
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [identity, load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing.length]);

  useEffect(() => {
    if (!identity) return;
    for (const m of messages) {
      if (m.sessionId === identity.sessionId) continue;
      if (readSent.current.has(m.id)) continue;
      readSent.current.add(m.id);
      void fetch(`/api/chat/${m.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: identity.sessionId }),
      });
    }
  }, [messages, identity]);

  function notifyTyping() {
    if (!identity) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    void fetch("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: identity.sessionId,
        author: identity.displayName,
        channel: "general",
      }),
    });
    typingTimer.current = setTimeout(() => { typingTimer.current = null; }, 2000);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!identity || !content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: identity.displayName,
        sessionId: identity.sessionId,
        content: content.trim(),
        channel: "general",
        replyTo: replyTo
          ? { id: replyTo.id, author: replyTo.author, content: replyTo.content }
          : null,
      }),
    });
    setLoading(false);
    if (res.ok) { setContent(""); setReplyTo(null); load(); }
  }

  // ── Supprimer un message ──────────────────────────────────────────────────
  function deleteMessage(message: ChatMessage) {
    setDeleteTarget(message);
  }

  function deleteForMe() {
    if (!deleteTarget) return;
    hiddenForMe.current.add(deleteTarget.id);
    localStorage.setItem("valueit_hidden_msgs", JSON.stringify([...hiddenForMe.current]));
    setDeleteTarget(null);
  }

  async function deleteForEveryone() {
    if (!identity || !deleteTarget) return;
    const res = await fetch(`/api/chat/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: identity.sessionId }),
    });
    setDeleteTarget(null);
    if (res.ok) load();
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  // ── Reply ─────────────────────────────────────────────────────────────────
  function startReply(m: ChatMessage) {
    setReplyTo(m);
    inputRef.current?.focus();
  }

  async function uploadFile(file: File) {
    if (!identity) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/chat/upload", {
      method: "POST",
      headers: { "x-chat-session": identity.sessionId },
      body: form,
    });
    if (!res.ok) return;
    const data = await res.json();
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: identity.displayName,
        sessionId: identity.sessionId,
        content: file.name,
        channel: "general",
        imageUrl: data.imageUrl,
        attachmentUrl: data.attachmentUrl,
      }),
    });
    load();
  }

  async function react(messageId: string, emoji: string) {
    if (!identity) return;
    await fetch(`/api/chat/${messageId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: identity.sessionId, emoji }),
    });
    setEmojiPickerMsgId(null);
    load();
  }

  function changeIdentity() {
    const isAuth = identity?.sessionId?.startsWith("auth_");
    const newId = regenerateAnonymousIdentity();
    if (isAuth) {
      newId.sessionId = identity!.sessionId;
      const storageKey = `valueit_auth_identity_${identity!.sessionId.replace("auth_", "")}`;
      localStorage.setItem(storageKey, JSON.stringify(newId));
      setIdentity({ ...newId, displayName: `${newId.emoji} ${newId.label}` });
    } else {
      setIdentity(newId);
    }
    readSent.current.clear();
  }

  async function banSession() {
    if (!modSession.trim()) return;
    await fetch("/api/chat/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: modSession.trim(), reason: "Signalement modération RH", hours: 24 }),
    });
    setModSession("");
    alert("Session bannie 24h.");
  }

  async function reportMessage(messageId: string) {
    const reason = prompt("Motif du signalement :");
    if (!reason?.trim()) return;
    await fetch("/api/chat/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, sessionId: identity?.sessionId, reason: reason.trim() }),
    });
    alert("Signalement envoyé aux RH.");
  }

  if (!identity) return null;

  const rootClass = ["messenger-chat", `messenger-chat--${variant}`].join(" ");
  let lastDay = "";

  return (
    <div className={rootClass}>
      {/* ── Header ── */}
      <header className="messenger-win-header">
        <div className="messenger-win-title">
          <span className="messenger-online-dot" aria-hidden />
          <div>
            <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                className="avatar-badge"
                style={{ background: COLOR_MAP[identity.label.split("_").pop()!] ?? "#6B7280", width: "1.6rem", height: "1.6rem", fontSize: "0.85rem" }}
              >
                {identity.emoji}
              </span>
              {identity.label.split("_").slice(1).join(" ")} (Session #{getSessionShortId(identity.sessionId)})
            </strong>
            <p className="messenger-channel-label">
              <MessageSquare size={23} className="icon-inline" aria-hidden />
              Salon Public VALUE-IT · {onlineCount} collègue{onlineCount > 1 ? "s" : ""} connecté{onlineCount > 1 ? "s" : ""} en ce moment
            </p>
          </div>
        </div>
        <div className="messenger-win-actions">
          {variant === "fullscreen" && (
            <Link href="/" className="messenger-win-link" title="Accueil"><Maximize2 size={15} /></Link>
          )}
          {variant === "window" && (
            <button type="button" onClick={toggleMaximized} className="messenger-win-link" title={maximized ? "Réduire" : "Plein écran"}>
              {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
          {(variant === "window" || variant === "fullscreen") && onClose && (
            <button type="button" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <section className="messenger-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="messenger-empty">Soyez le premier à écrire !</p>
        )}

        {messages
          .filter((m) => !hiddenForMe.current.has(m.id))
          .map((m) => {
          const day = new Date(m.createdAt).toDateString();
          const showDay = day !== lastDay;
          if (showDay) lastDay = day;
          const isMine = m.sessionId === identity.sessionId;
          const isDeleted = !!m.deletedAt;
          const reactionEntries = isDeleted ? [] : Object.entries(m.reactions);

          if (isDeleted) {
            return (
              <div key={m.id} className="messenger-msg-row">
                {showDay && <p className="messenger-day-sep">{formatDayLabel(m.createdAt)}</p>}
                <article className="messenger-bubble-wrap messenger-msg-deleted">
                  <p className="messenger-bubble-author">
                    <span className="avatar-badge avatar-badge--sm" style={{ background: "#6B7280" }}>
                      {m.author.split(/\s/)[0] || "💬"}
                    </span>
                    {m.author.replace(m.author.split(/\s/)[0], "").trim()}
                  </p>
                  <div className="messenger-bubble messenger-bubble--deleted">
                    <p className="messenger-bubble-text" style={{ fontStyle: "italic", opacity: 0.5 }}>
                      Message supprimé
                    </p>
                  </div>
                  <div className="messenger-bubble-meta">
                    <time dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                </article>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={isMine ? "messenger-msg-row messenger-msg-row--mine" : "messenger-msg-row"}
            >
              {showDay && <p className="messenger-day-sep">{formatDayLabel(m.createdAt)}</p>}

              <article
                className={`messenger-bubble-wrap ${isMine ? "messenger-bubble-wrap--mine" : ""}`}
                onMouseEnter={() => setHoverMsg(m.id)}
                onMouseLeave={() => { setHoverMsg(null); setEmojiPickerMsgId(null); }}
              >
                {!isMine && (() => {
                  const emoji = m.author.split(/\s/)[0];
                  const colorLabel = m.author.split("_").pop()!;
                  return (
                    <p className="messenger-bubble-author">
                      <span
                        className="avatar-badge avatar-badge--sm"
                        style={{ background: COLOR_MAP[colorLabel] ?? "#6B7280" }}
                      >
                        {emoji}
                      </span>
                      {m.author.replace(emoji, "").trim()}
                    </p>
                  );
                })()}

                {/* Citation reply */}
                {m.replyTo && (
                  <div className="messenger-reply-preview">
                    <span className="messenger-reply-preview__author">{m.replyTo.author}</span>
                    <span className="messenger-reply-preview__text">{m.replyTo.content}</span>
                  </div>
                )}

                <div className={`messenger-bubble ${isMine ? "messenger-bubble--mine" : ""}`}>
                  {m.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt="" className="messenger-bubble-image" />
                  )}
                  {m.attachmentUrl && (
                    <a href={m.attachmentUrl} className="messenger-bubble-file" target="_blank" rel="noopener noreferrer">
                      <Paperclip size={13} className="icon-inline" /> Fichier joint
                    </a>
                  )}
                  <p className="messenger-bubble-text">{m.content}</p>
                </div>

                <div className="messenger-bubble-meta">
                  <time dateTime={m.createdAt}>
                    {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  {isMine && m.readCount > 0 && (
                    <span className="messenger-read-receipt">
                      <CheckCheck size={12} className="icon-inline" />
                      Lu par {m.readCount} personne{m.readCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {reactionEntries.length > 0 && (
                    <span className="messenger-msg-reactions">
                      {reactionEntries.map(([emoji, count]) => (
                        <span key={emoji}>{emoji}×{count}</span>
                      ))}
                    </span>
                  )}
                </div>

                {/* ── Barre d'actions au survol ── */}
                {hoverMsg === m.id && (
                  <div className={`messenger-action-bar ${isMine ? "messenger-action-bar--mine" : ""}`}>

                    {/* Répondre */}
                    <button
                      type="button"
                      title="Répondre"
                      className="messenger-action-btn"
                      onClick={() => startReply(m)}
                    >
                      <CornerUpLeft size={14} />
                    </button>

                    {/* Emoji picker inline */}
                    <button
                      type="button"
                      title="Réagir"
                      className="messenger-action-btn"
                      onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === m.id ? null : m.id)}
                    >
                      <Smile size={14} />
                    </button>

                    {/* Supprimer — uniquement ses propres messages */}
                    {isMine && (
                      <button
                        type="button"
                        title="Supprimer"
                        className="messenger-action-btn messenger-action-btn--danger"
                        onClick={() => deleteMessage(m)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* Signaler — uniquement les messages des autres */}
                    {showModeration && !isMine && (
                      <button
                        type="button"
                        title="Signaler"
                        className="messenger-action-btn messenger-action-btn--danger"
                        onClick={() => reportMessage(m.id)}
                      >
                        <Flag size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Picker d'emojis de réaction inline */}
                {emojiPickerMsgId === m.id && (
                  <div className="messenger-reaction-bar">
                    {CHAT_REACTIONS.map((r) => (
                      <button key={r.id} type="button" title={r.id} onClick={() => react(m.id, r.emoji)}>
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            </div>
          );
        })}

        {typing.length > 0 && (
          <p className="messenger-typing">
            {typing.join(", ")} (En train d&apos;écrire…{" "}
            <span className="messenger-typing-dots"><span /><span /><span /></span>)
          </p>
        )}
      </section>

      {/* ── Bandeau reply ── */}
      {replyTo && (
        <div className="messenger-reply-bar">
          <CornerUpLeft size={13} className="icon-inline" />
          <div className="messenger-reply-bar__content">
            <span className="messenger-reply-bar__author">{replyTo.author}</span>
            <span className="messenger-reply-bar__text">{replyTo.content}</span>
          </div>
          <button
            type="button"
            aria-label="Annuler la réponse"
            onClick={() => setReplyTo(null)}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Zone de saisie ── */}
      <form className="messenger-compose" onSubmit={send}>
        <div className="messenger-compose-tools">
          <label className="messenger-tool-btn" title="Fichier">
            <Paperclip size={17} />
            <input type="file" hidden accept=".pdf,.docx,.xlsx,image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); }} />
          </label>
          <label className="messenger-tool-btn" title="Image">
            <ImageIcon size={17} />
            <input type="file" hidden accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); }} />
          </label>
          <button type="button" className="messenger-tool-btn"
            onClick={() => setShowEmoji((v) => !v)} title="Émojis">
            <Smile size={17} />
          </button>
          <button type="button" className="messenger-tool-btn messenger-tool-btn--disabled"
            title="Messages vocaux désactivés (RH)" disabled>
            <Mic size={17} />
          </button>
        </div>

        {showEmoji && (
          <div className="messenger-emoji-picker">
            {QUICK_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setContent((c) => c + e)}>{e}</button>
            ))}
          </div>
        )}

        <div className="messenger-input-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="Écrivez un message anonyme…"
            value={content}
            onChange={(e) => { setContent(e.target.value); notifyTyping(); }}
            maxLength={2000}
            aria-label="Message"
          />
          <button type="submit" className="btn btn-fb messenger-send"
            disabled={loading || !content.trim()} aria-label="Envoyer">
            <Send size={15} />
          </button>
        </div>
      </form>

      {/* ── Footer ── */}
      <footer className="messenger-footer">
        <button type="button" className="messenger-identity-btn" onClick={changeIdentity}>
          <Settings size={13} className="icon-inline" />
          <span
            className="avatar-badge"
            style={{ background: COLOR_MAP[identity.label.split("_").pop()!] ?? "#6B7280" }}
          >
            {identity.emoji}
          </span>
          {identity.label.split("_").slice(1).join(" ")} Changer
        </button>
        <span className="messenger-footer-secure">
          <Lock size={11} className="icon-inline" /> Connexion sécurisée au LAN
        </span>
      </footer>

      {showModeration && (
        <div className="messenger-mod-bar">
          <input placeholder="Session ID à bannir (RH)" value={modSession}
            onChange={(e) => setModSession(e.target.value)} />
          <button type="button" className="btn btn-sm btn-primary" onClick={banSession}>
            Bannir 24h
          </button>
        </div>
      )}

      {deleteTarget && (() => {
        const canDeleteAll = Date.now() - new Date(deleteTarget.createdAt).getTime() < 10 * 60 * 1000;
        return (
          <div className="modal-overlay" onClick={cancelDelete}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Supprimer le message</h3>
                <button type="button" className="modal-close" onClick={cancelDelete} aria-label="Fermer"><X size={18} /></button>
              </div>
              <div className="messenger-delete-options">
                <button type="button" className="messenger-delete-option" onClick={deleteForMe}>
                  <strong>Supprimer pour moi</strong>
                  <span>Le message disparaît de votre vue uniquement</span>
                </button>
                <button
                  type="button"
                  className={`messenger-delete-option${!canDeleteAll ? " messenger-delete-option--disabled" : ""}`}
                  onClick={canDeleteAll ? deleteForEveryone : undefined}
                  disabled={!canDeleteAll}
                >
                  <strong>Supprimer pour tout le monde</strong>
                  <span>{canDeleteAll ? "Supprimé pour tous les participants" : "Délai de 10 minutes dépassé"}</span>
                </button>
              </div>
              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={cancelDelete}>Annuler</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}