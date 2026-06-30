"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Link2,
  Bell,
  Pin,
  PinOff,
  Pencil,
  MessageSquareOff,
  MessageSquare,
  History,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import type { FeedPost } from "@/lib/feed";
import { isRhOrAdmin } from "@/lib/roles";
import type { Role } from "@prisma/client";

type Props = {
  post: FeedPost;
  currentUser: { id: string; role: Role };
  saved: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComments: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onShowRevisions: () => void;
};

export function PostMenu({
  post,
  currentUser,
  saved,
  onSave,
  onEdit,
  onDelete,
  onToggleComments,
  onPin,
  onUnpin,
  onShowRevisions,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMod = isRhOrAdmin(currentUser.role);
  const canManage = currentUser.id === post.author.id || isMod;

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function copyLink() {
    const url = `${window.location.origin}/annonces#post-${post.id}`;
    void navigator.clipboard.writeText(url);
    setOpen(false);
  }

  return (
    <div className="post-menu" ref={ref}>
      {/* Bouton déclencheur */}
      <button
        type="button"
        className="post-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Options de publication"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <ul className="post-menu-dropdown">
          {/* Enregistrer */}
          <li>
            <button type="button" onClick={() => { onSave(); setOpen(false); }}>
              {saved
                ? <><BookmarkCheck size={15} className="post-menu-icon" /> Retirer des favoris</>
                : <><Bookmark size={15} className="post-menu-icon" /> Enregistrer pour plus tard</>
              }
            </button>
          </li>

          {/* Copier le lien */}
          <li>
            <button type="button" onClick={copyLink}>
              <Link2 size={15} className="post-menu-icon" />
              Copier le lien direct
            </button>
          </li>

          {/* Notifications (bientôt) */}
          <li>
            <button type="button" onClick={() => setOpen(false)}>
              <Bell size={15} className="post-menu-icon" />
              Notifications 
            </button>
          </li>

          {/* Actions modérateur / auteur */}
          {canManage && (
            <>
              {isMod && (
                <li>
                  {post.pinned ? (
                    <button type="button" onClick={() => { onUnpin(); setOpen(false); }}>
                      <PinOff size={15} className="post-menu-icon" />
                      Désépingler du haut de la page
                    </button>
                  ) : (
                    <button type="button" onClick={() => { onPin(); setOpen(false); }}>
                      <Pin size={15} className="post-menu-icon" />
                      Épingler en haut de la page
                    </button>
                  )}
                </li>
              )}

              <li>
                <button type="button" onClick={() => { onEdit(); setOpen(false); }}>
                  <Pencil size={15} className="post-menu-icon" />
                  Modifier la publication
                </button>
              </li>

              <li>
                <button type="button" onClick={() => { onToggleComments(); setOpen(false); }}>
                  {post.allowComments
                    ? <><MessageSquareOff size={15} className="post-menu-icon" /> Désactiver les commentaires</>
                    : <><MessageSquare size={15} className="post-menu-icon" /> Activer les commentaires</>
                  }
                </button>
              </li>

              {post.revisionCount > 0 && isMod && (
                <li>
                  <button type="button" onClick={() => { onShowRevisions(); setOpen(false); }}>
                    <History size={15} className="post-menu-icon" />
                    Historique des révisions
                  </button>
                </li>
              )}

              {/* Action dangereuse — séparée visuellement */}
              <li className="post-menu-separator" />
              <li>
                <button
                  type="button"
                  className="post-menu-danger"
                  onClick={() => { onDelete(); setOpen(false); }}
                >
                  <Trash2 size={15} className="post-menu-icon" />
                  Déplacer vers la corbeille
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}