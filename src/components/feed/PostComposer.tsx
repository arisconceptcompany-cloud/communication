"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { POST_TYPOLOGIES } from "@/lib/post-typologies";
import type { MediaItem } from "@/lib/post-media";
import { PostAvatar } from "./PostAvatar";

type TagUser = { id: string; name: string; department: string | null };

const MOODS = [
  "se sent 🚀 enthousiaste",
  "célèbre 🥂 une réussite",
  "est 💼 à l'écoute de l'équipe",
  "partage 📢 une annonce importante",
];

const LOCATIONS = [
  "à VALUE-IT — Siège Antananarivo",
  "à VALUE-IT — Télétravail",
  "au bureau — Open space",
];

type Props = {
  userName: string;
};

export function PostComposer({ userName }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [moodActivity, setMoodActivity] = useState("");
  const [location, setLocation] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [allowAnonymousComments, setAllowAnonymousComments] = useState(false);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollExpiresAt, setPollExpiresAt] = useState("");
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<TagUser[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [panel, setPanel] = useState<
    "none" | "media" | "tag" | "mood" | "poll" | "privacy" | "typology"
  >("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/users/tagging")
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  }, []);

  async function uploadFile(file: File, kind: "image" | "video" | "pdf") {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Upload échoué");
    }
    const data = await res.json();
    if (kind === "pdf") {
      setAttachmentUrl(data.url);
    } else if (kind === "video") {
      setVideoUrl(data.url);
      setMediaGallery((g) => [
        ...g,
        { type: "video", url: data.url, label: file.name },
      ]);
    } else {
      setImageUrl(data.url);
      setMediaGallery((g) => [...g, { type: "image", url: data.url }]);
    }
  }

  function toggleTag(id: string) {
    setTaggedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 10) {
      setError("Le contenu doit contenir au moins 10 caractères.");
      return;
    }

    if (pollEnabled) {
      const opts = pollOptions.filter((o) => o.trim());
      if (!pollQuestion.trim() || opts.length < 2) {
        setError("Le sondage nécessite une question et au moins 2 options.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        title: title.trim() || body.trim().slice(0, 80),
        body: body.trim(),
        category,
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        attachmentUrl: attachmentUrl.trim() || null,
        mediaGallery: mediaGallery.length ? mediaGallery : undefined,
        taggedUserIds: taggedUserIds.length ? taggedUserIds : undefined,
        moodActivity: moodActivity || null,
        location: location || null,
        targetDepartment: targetDepartment || null,
        scheduledAt: scheduledAt || null,
        expiresAt: expiresAt || null,
        pinned,
        allowComments,
        allowReactions,
        allowAnonymousComments,
      };

      if (pollEnabled) {
        payload.poll = {
          question: pollQuestion.trim(),
          expiresAt: pollExpiresAt || null,
          options: pollOptions
            .filter((o) => o.trim())
            .map((label) => ({ label: label.trim() })),
        };
      }

      const res = await fetch("/api/annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (!res.ok) {
        let errorMsg = "Erreur lors de la publication";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `Erreur serveur (${res.status})`;
        }
        setError(errorMsg);
        return;
      }

      setTitle("");
      setBody("");
      setImageUrl("");
      setVideoUrl("");
      setAttachmentUrl("");
      setMediaGallery([]);
      setMoodActivity("");
      setLocation("");
      setTargetDepartment("");
      setScheduledAt("");
      setPollEnabled(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setTaggedUserIds([]);
      setPanel("none");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erreur réseau — veuillez réessayer");
    }
  }

  return (
    <form className="post-composer feed-card post-composer--fb" onSubmit={handleSubmit}>
      {error && <p className="alert alert-error">{error}</p>}

      <div className="post-composer-main">
        <PostAvatar name={userName} />
        <div className="post-composer-editor">
          <input
            className="post-composer-title"
            placeholder="Titre de la publication (optionnel)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="post-composer-body"
            placeholder={`Quoi de neuf, ${userName.split(" ")[0]} ?`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
          />
          <small
            style={{
              display: "block",
              marginTop: 4,
              fontSize: "0.75rem",
              color: body.trim().length >= 10 ? "var(--text-muted)" : "var(--orange)",
              opacity: body.length === 0 ? 0.5 : 1,
            }}
          >
            {body.length}/10 caractères minimum
          </small>
          {(moodActivity || location) && (
            <p className="post-composer-status">
              {moodActivity && <span>{moodActivity}</span>}
              {location && <span> · 📍 {location}</span>}
            </p>
          )}
        </div>
      </div>

      {mediaGallery.length > 0 && (
        <div className="post-composer-gallery-preview">
          {mediaGallery.map((m, i) => (
            <figure key={i}>
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" />
              ) : (
                <video src={m.url} muted />
              )}
            </figure>
          ))}
        </div>
      )}

      {panel === "typology" && (
        <div className="typology-picker">
          <span className="typology-picker-label">Typologie</span>
          <div className="typology-picker-chips">
            {POST_TYPOLOGIES.map((typo) => (
              <button
                key={typo.id}
                type="button"
                className={`typology-chip ${typo.cssClass} ${
                  category === typo.id ? "typology-chip--active" : ""
                }`}
                onClick={() => setCategory(typo.id)}
              >
                {typo.emoji} {typo.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === "media" && (
        <div className="post-parameters-panel">
          <label className="post-parameters-row">
            🖼️ Photo / image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f, "image").catch((err) => setError(err.message));
              }}
            />
          </label>
          <label className="post-parameters-row">
            🎬 Vidéo
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f, "video").catch((err) => setError(err.message));
              }}
            />
          </label>
          <label className="post-parameters-row">
            📎 PDF / note de service
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f, "pdf").catch((err) => setError(err.message));
              }}
            />
          </label>
        </div>
      )}

      {panel === "tag" && (
        <div className="post-parameters-panel post-tag-picker">
          <p className="typology-picker-label">👥 Identifier des personnes</p>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={taggedUserIds.includes(u.id)}
                    onChange={() => toggleTag(u.id)}
                  />
                  {u.name}
                  {u.department && (
                    <span className="fb-widget-desc"> ({u.department})</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {panel === "mood" && (
        <div className="post-parameters-panel">
          <label>
            🎭 Humeur / activité
            <select
              value={moodActivity}
              onChange={(e) => setMoodActivity(e.target.value)}
            >
              <option value="">— Aucune —</option>
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            📍 Lieu
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">— Aucun —</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {panel === "poll" && (
        <div className="post-parameters-panel">
          <label className="post-parameters-check">
            <input
              type="checkbox"
              checked={pollEnabled}
              onChange={(e) => setPollEnabled(e.target.checked)}
            />
            <span>📊 Activer un sondage</span>
          </label>
          {pollEnabled && (
            <>
              <input
                placeholder="Question du sondage"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                />
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPollOptions((o) => [...o, ""])}
              >
                + Option
              </button>
              <label>
                Expiration du sondage
                <input
                  type="datetime-local"
                  value={pollExpiresAt}
                  onChange={(e) => setPollExpiresAt(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      )}

      {panel === "privacy" && (
        <div className="post-parameters-panel">
          <label>
            🎛️ Audience
            <select
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
            >
              <option value="">Tout VALUE-IT</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d} uniquement
                </option>
              ))}
            </select>
          </label>
          <label>
            📅 Planifier la publication
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </label>
          <label>
            Date d&apos;expiration du post
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
          <label className="post-parameters-check">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <span>📌 Épingler</span>
          </label>
          <label className="post-parameters-check">
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(e) => setAllowComments(e.target.checked)}
            />
            <span>💬 Commentaires</span>
          </label>
          <label className="post-parameters-check">
            <input
              type="checkbox"
              checked={allowAnonymousComments}
              onChange={(e) => setAllowAnonymousComments(e.target.checked)}
            />
            <span>🕶️ Commentaires anonymes autorisés</span>
          </label>
          <label className="post-parameters-check">
            <input
              type="checkbox"
              checked={allowReactions}
              onChange={(e) => setAllowReactions(e.target.checked)}
            />
            <span>👍 Réactions</span>
          </label>
        </div>
      )}

      <p className="post-composer-add-label">Ajouter à votre publication :</p>
      <div className="post-composer-toolbar post-composer-toolbar--fb">
        <button
          type="button"
          className="post-composer-tool"
          onClick={() => setPanel(panel === "media" ? "none" : "media")}
        >
          🖼️ Photo/Vidéo
        </button>
        <button
          type="button"
          className="post-composer-tool"
          onClick={() => setPanel(panel === "tag" ? "none" : "tag")}
        >
          👥 Identifier
        </button>
        <button
          type="button"
          className="post-composer-tool"
          onClick={() => setPanel(panel === "mood" ? "none" : "mood")}
        >
          🎭 Humeur
        </button>
        <button
          type="button"
          className="post-composer-tool"
          onClick={() => setPanel(panel === "poll" ? "none" : "poll")}
        >
          📊 Sondage
        </button>
        <button
          type="button"
          className="post-composer-tool"
          onClick={() => setPanel(panel === "privacy" ? "none" : "privacy")}
        >
          🎛️ Diffusion
        </button>
        <button
          type="button"
          className="post-composer-tool"
          onClick={() => setPanel(panel === "typology" ? "none" : "typology")}
        >
          🏷️ Typologie
        </button>
        <span className="post-composer-counter">{body.length} car.</span>
      </div>

      <button
        type="submit"
        className="btn btn-primary post-composer-submit"
        disabled={loading || body.trim().length < 10}
      >
        {loading ? "Publication…" : scheduledAt ? "Planifier" : "Publier"}
      </button>
    </form>
  );
}
