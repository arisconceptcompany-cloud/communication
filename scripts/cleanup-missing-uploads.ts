/**
 * Repère les URL /uploads/... qui ne pointent plus vers un fichier présent.
 *
 * Usage (dans le conteneur ou avec le même DATABASE_URL) :
 *   npx tsx scripts/cleanup-missing-uploads.ts          # rapport seulement
 *   npx tsx scripts/cleanup-missing-uploads.ts --fix    # nettoie la base
 *
 * Le --fix ne supprime aucun fichier (ils sont déjà absents) : il met simplement
 * les champs cassés à null et retire les éléments morts des galeries.
 */
import { existsSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FIX = process.argv.includes("--fix");

type GalleryItem = { type: "image" | "video"; url: string; label?: string };

function localPath(url: string | null | undefined): string | null {
  if (!url?.startsWith("/uploads/")) return null;
  const relative = path.posix.normalize(url).replace(/^\/+/, "");
  if (relative.split("/").includes("..")) return null;
  return path.join(process.cwd(), "public", relative);
}

function isMissing(url: string | null | undefined): boolean {
  const file = localPath(url);
  return Boolean(file && !existsSync(file));
}

function parseGallery(raw: string | null): GalleryItem[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as GalleryItem[]) : [];
  } catch {
    return [];
  }
}

function printBroken(label: string, id: string, urls: string[]) {
  if (urls.length === 0) return;
  console.log(`  ${label} ${id}`);
  for (const url of urls) console.log(`    - ${url}`);
}

async function main() {
  console.log(
    FIX
      ? "=== Nettoyage des références /uploads/ cassées ==="
      : "=== Rapport des références /uploads/ cassées (aucune modification) ==="
  );

  let reports = 0;
  let fixes = 0;

  // Publications
  const posts = await prisma.announcement.findMany({
    select: {
      id: true,
      title: true,
      imageUrl: true,
      videoUrl: true,
      attachmentUrl: true,
      mediaGallery: true,
    },
  });
  for (const post of posts) {
    const urls = [
      post.imageUrl,
      post.videoUrl,
      post.attachmentUrl,
      ...parseGallery(post.mediaGallery).map((item) => item.url),
    ].filter((url): url is string => Boolean(isMissing(url)));

    if (urls.length === 0) continue;
    reports += 1;
    printBroken(`Publication « ${post.title} »`, post.id, urls);

    if (FIX) {
      const gallery = parseGallery(post.mediaGallery);
      const keptGallery = gallery.filter((item) => !isMissing(item.url));
      await prisma.announcement.update({
        where: { id: post.id },
        data: {
          imageUrl: isMissing(post.imageUrl) ? null : undefined,
          videoUrl: isMissing(post.videoUrl) ? null : undefined,
          attachmentUrl: isMissing(post.attachmentUrl) ? null : undefined,
          mediaGallery:
            keptGallery.length !== gallery.length
              ? JSON.stringify(keptGallery)
              : undefined,
        },
      });
      fixes += 1;
    }
  }

  // Commentaires
  const comments = await prisma.postComment.findMany({
    select: {
      id: true,
      body: true,
      imageUrl: true,
      attachmentUrl: true,
      attachmentName: true,
    },
  });
  for (const comment of comments) {
    const urls = [comment.imageUrl, comment.attachmentUrl].filter(
      (url): url is string => Boolean(isMissing(url))
    );
    if (urls.length === 0) continue;
    reports += 1;
    printBroken("Commentaire", comment.id, urls);

    if (FIX) {
      const empty = !comment.body.trim();
      if (empty) {
        // Les réponses sont supprimées en cascade par le schéma.
        await prisma.postComment.delete({ where: { id: comment.id } });
      } else {
        await prisma.postComment.update({
          where: { id: comment.id },
          data: {
            imageUrl: isMissing(comment.imageUrl) ? null : undefined,
            attachmentUrl: isMissing(comment.attachmentUrl)
              ? null
              : undefined,
            attachmentName: isMissing(comment.attachmentUrl)
              ? null
              : undefined,
          },
        });
      }
      fixes += 1;
    }
  }

  // Messages du chat
  const messages = await prisma.chatMessage.findMany({
    select: { id: true, imageUrl: true, attachmentUrl: true },
  });
  for (const message of messages) {
    const urls = [message.imageUrl, message.attachmentUrl].filter(
      (url): url is string => Boolean(isMissing(url))
    );
    if (urls.length === 0) continue;
    reports += 1;
    printBroken("Message", message.id, urls);

    if (FIX) {
      await prisma.chatMessage.update({
        where: { id: message.id },
        data: {
          imageUrl: isMissing(message.imageUrl) ? null : undefined,
          attachmentUrl: isMissing(message.attachmentUrl) ? null : undefined,
        },
      });
      fixes += 1;
    }
  }

  console.log("");
  console.log(`Références cassées : ${reports}`);
  console.log(FIX ? `Éléments corrigés : ${fixes}` : "Relancez avec --fix pour nettoyer.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
