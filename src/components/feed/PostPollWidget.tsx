"use client";

import { useState } from "react";
import type { FeedPoll } from "@/lib/feed";

type Props = {
  postId: string;
  poll: FeedPoll;
};

function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

export function PostPollWidget({ postId, poll: initial }: Props) {
  const [poll, setPoll] = useState(initial);
  const [busy, setBusy] = useState(false);
  const remaining = daysLeft(poll.expiresAt);
  const expired = remaining !== null && remaining <= 0;

  async function vote(optionId: string) {
    if (busy || expired) return;
    setBusy(true);
    const res = await fetch(`/api/annonces/${postId}/poll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setPoll((p) => ({
      ...p,
      totalVotes: data.totalVotes,
      userVotedOptionId: data.userVotedOptionId,
      options: data.options,
    }));
  }

  return (
    <section className="post-poll">
      <h3 className="post-poll-title">📊 {poll.question}</h3>
      <ul className="post-poll-options">
        {poll.options.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              className={`post-poll-option ${
                poll.userVotedOptionId === opt.id
                  ? "post-poll-option--voted"
                  : ""
              }`}
              onClick={() => vote(opt.id)}
              disabled={busy || expired}
            >
              <span className="post-poll-option-label">
                🔘 {opt.label}
                {poll.totalVotes > 0 && (
                  <span className="post-poll-percent">
                    {" "}
                    ({opt.percent}% — {opt.voteCount} vote
                    {opt.voteCount > 1 ? "s" : ""})
                  </span>
                )}
              </span>
              {poll.totalVotes > 0 && (
                <span
                  className="post-poll-bar"
                  style={{ width: `${opt.percent}%` }}
                  aria-hidden
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="post-poll-meta">
        👥 {poll.totalVotes} vote{poll.totalVotes > 1 ? "s" : ""} au total
        {remaining !== null && !expired && (
          <> · ⏳ Il reste {remaining} jour{remaining > 1 ? "s" : ""} pour voter</>
        )}
        {expired && <> · Sondage clos</>}
      </p>
    </section>
  );
}
