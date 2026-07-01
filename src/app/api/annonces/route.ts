import { NextResponse } from "next/server";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { isValidTypology } from "@/lib/post-typologies";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const pollOptionSchema = z.object({
  label: z.string().min(1).max(200),
});

const schema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10),
  category: z.string().min(1),
  expiresAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  videoUrl: z.string().max(500).nullable().optional(),
  attachmentUrl: z.string().max(500).nullable().optional(),
  mediaGallery: z
    .array(
      z.object({
        type: z.enum(["image", "video"]),
        url: z.string().max(500),
        label: z.string().max(200).optional(),
      })
    )
    .optional(),
  taggedUserIds: z.array(z.string()).optional(),
  moodActivity: z.string().max(200).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  targetDepartment: z.string().max(100).nullable().optional(),
  pinned: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  allowReactions: z.boolean().optional(),
  allowAnonymousComments: z.boolean().optional(),
  poll: z
    .object({
      question: z.string().min(3).max(300),
      expiresAt: z.string().nullable().optional(),
      options: z.array(pollOptionSchema).min(2).max(6),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!isRhOrAdmin(session.role)) {
      return NextResponse.json(
        { error: "Publication réservée aux équipes RH et Admin" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!isValidTypology(parsed.data.category)) {
      return NextResponse.json({ error: "Typologie invalide" }, { status: 400 });
    }

    const scheduledAt = parsed.data.scheduledAt
      ? new Date(parsed.data.scheduledAt)
      : null;
    const isScheduled = scheduledAt && scheduledAt > new Date();

    const post = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        category: parsed.data.category,
        authorId: session.id,
        imageUrl: parsed.data.imageUrl ?? null,
        videoUrl: parsed.data.videoUrl ?? null,
        attachmentUrl: parsed.data.attachmentUrl ?? null,
        mediaGallery: parsed.data.mediaGallery
          ? JSON.stringify(parsed.data.mediaGallery)
          : null,
        taggedUserIds: parsed.data.taggedUserIds
          ? JSON.stringify(parsed.data.taggedUserIds)
          : null,
        moodActivity: parsed.data.moodActivity ?? null,
        location: parsed.data.location ?? null,
        targetDepartment: parsed.data.targetDepartment ?? null,
        pinned: parsed.data.pinned === true && isRhOrAdmin(session.role),
        allowComments: parsed.data.allowComments ?? true,
        allowReactions: parsed.data.allowReactions ?? true,
        allowAnonymousComments: parsed.data.allowAnonymousComments ?? false,
        published: !isScheduled,
        scheduledAt,
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : null,
      },
    });

    if (parsed.data.poll) {
      await prisma.postPoll.create({
        data: {
          postId: post.id,
          question: parsed.data.poll.question,
          expiresAt: parsed.data.poll.expiresAt
            ? new Date(parsed.data.poll.expiresAt)
            : null,
          options: {
            create: parsed.data.poll.options.map((opt, i) => ({
              label: opt.label,
              sortOrder: i,
            })),
          },
        },
      });
    }

    if (!isScheduled) {
      await prisma.notification.create({
        data: {
          userId: null,
          creatorId: session.id,
          type: "announcement",
          title: parsed.data.title,
          body: `Nouvelle publication : ${parsed.data.category}`,
          link: "/annonces",
        },
      });
    }

    return NextResponse.json({ ok: true, id: post.id });
  } catch (error) {
    console.error("POST /api/annonces error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la publication" },
      { status: 500 }
    );
  }
}
