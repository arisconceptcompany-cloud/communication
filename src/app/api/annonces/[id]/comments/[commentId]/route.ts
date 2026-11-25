import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; commentId: string }> };

const COMMENT_FILE_URL = /^\/uploads\/comments\/[A-Za-z0-9._-]+$/;

type CommentNode = {
  id: string;
  parentId: string | null;
  imageUrl: string | null;
  attachmentUrl: string | null;
};

/** Récupère le commentaire et toutes ses réponses (récursivement). */
async function collectSubtree(postId: string, rootId: string) {
  const comments = await prisma.postComment.findMany({
    where: { postId },
    select: {
      id: true,
      parentId: true,
      imageUrl: true,
      attachmentUrl: true,
    },
  });

  const childrenByParent = new Map<string | null, CommentNode[]>();
  for (const comment of comments) {
    const key = comment.parentId ?? null;
    const siblings = childrenByParent.get(key) ?? [];
    siblings.push(comment);
    childrenByParent.set(key, siblings);
  }

  const ids: string[] = [];
  const urls = new Set<string>();
  const seen = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const comment = comments.find((c) => c.id === current);
    if (!comment) continue;

    ids.push(comment.id);
    for (const url of [comment.imageUrl, comment.attachmentUrl]) {
      if (url && COMMENT_FILE_URL.test(url)) urls.add(url);
    }
    for (const child of childrenByParent.get(comment.id) ?? []) {
      queue.push(child.id);
    }
  }

  return { ids, urls: [...urls] };
}

/** Supprime les fichiers uniquement s'ils ne sont plus référencés ailleurs. */
async function removeUnusedFiles(urls: string[], deletedIds: string[]) {
  for (const url of urls) {
    const stillUsed = await prisma.postComment.count({
      where: {
        id: { notIn: deletedIds },
        OR: [{ imageUrl: url }, { attachmentUrl: url }],
      },
    });
    if (stillUsed > 0) continue;

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "comments",
      path.basename(url)
    );
    try {
      await unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Impossible de supprimer le fichier joint :", url, err);
      }
    }
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id, commentId } = await params;
  const comment = await prisma.postComment.findFirst({
    where: { id: commentId, postId: id },
    select: {
      id: true,
      authorId: true,
      post: { select: { deletedAt: true } },
    },
  });
  if (!comment || comment.post.deletedAt) {
    return NextResponse.json(
      { error: "Commentaire introuvable" },
      { status: 404 }
    );
  }

  const canDelete =
    comment.authorId === session.id || isRhOrAdmin(session.role);
  if (!canDelete) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { ids, urls } = await collectSubtree(id, commentId);
  await prisma.postComment.deleteMany({
    where: { id: { in: ids.length > 0 ? ids : [commentId] } },
  });
  await removeUnusedFiles(urls, ids);

  return NextResponse.json({ ok: true, deletedIds: ids });
}
