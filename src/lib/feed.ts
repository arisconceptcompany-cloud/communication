import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { parseMediaGallery, parseTaggedIds } from "@/lib/post-media";
import type { ReactionType } from "@/lib/reactions";

export type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  isAnonymous: boolean;
  anonymousLabel: string | null;
  author: { id: string; name: string; department: string | null };
  replies: FeedComment[];
};

export type FeedPollOption = {
  id: string;
  label: string;
  voteCount: number;
  percent: number;
};

export type FeedPoll = {
  id: string;
  question: string;
  expiresAt: string | null;
  totalVotes: number;
  userVotedOptionId: string | null;
  options: FeedPollOption[];
};

export type FeedTaggedUser = {
  id: string;
  name: string;
};

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  attachmentUrl: string | null;
  mediaGallery: ReturnType<typeof parseMediaGallery>;
  moodActivity: string | null;
  location: string | null;
  targetDepartment: string | null;
  pinned: boolean;
  allowComments: boolean;
  allowReactions: boolean;
  allowAnonymousComments: boolean;
  expiresAt: string | null;
  scheduledAt: string | null;
  linkClicks: number;
  shareCount: number;
  createdAt: string;
  author: { id: string; name: string; role: string; department: string | null };
  taggedUsers: FeedTaggedUser[];
  reactionCount: number;
  reactionSummary: { type: ReactionType; count: number }[];
  userReaction: ReactionType | null;
  userSaved: boolean;
  comments: FeedComment[];
  poll: FeedPoll | null;
  viewCount: number;
  revisionCount: number;
};

function buildCommentTree(
  flat: {
    id: string;
    body: string;
    createdAt: Date;
    parentId: string | null;
    isAnonymous: boolean;
    anonymousLabel: string | null;
    author: { id: string; name: string; department: string | null };
  }[]
): FeedComment[] {
  const map = new Map<string, FeedComment>();
  const roots: FeedComment[] = [];

  for (const c of flat) {
    map.set(c.id, {
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      parentId: c.parentId,
      isAnonymous: c.isAnonymous,
      anonymousLabel: c.anonymousLabel,
      author: c.author,
      replies: [],
    });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

async function publishDuePosts() {
  await prisma.announcement.updateMany({
    where: {
      published: false,
      deletedAt: null,
      scheduledAt: { lte: new Date() },
    },
    data: { published: true },
  });
}

export async function getFeedPosts(
  session: SessionUser | null
): Promise<FeedPost[]> {
  await publishDuePosts();
  const now = new Date();

  const posts = await prisma.announcement.findMany({
    where: {
      published: true,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        },
      ],
    },
    include: {
      author: {
        select: { id: true, name: true, role: true, department: true },
      },
      reactions: { select: { userId: true, type: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, department: true },
          },
        },
      },
      poll: {
        include: {
          options: { orderBy: { sortOrder: "asc" } },
          votes: { select: { userId: true, optionId: true } },
        },
      },
      ...(session
        ? { saves: { where: { userId: session.id } } }
        : {}),
      views: { select: { userId: true } },
      revisions: { select: { id: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  const allTaggedIds = [
    ...new Set(posts.flatMap((p) => parseTaggedIds(p.taggedUserIds))),
  ];
  const taggedUsersMap = new Map<string, FeedTaggedUser>();
  if (allTaggedIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: allTaggedIds } },
      select: { id: true, name: true },
    });
    for (const u of users) taggedUsersMap.set(u.id, u);
  }

  const totalUsers = await prisma.user.count();

  return posts
    .filter((post) => {
      if (!post.targetDepartment || post.pinned) return true;
      if (!session) return false;
      if (session.role === "ADMIN" || session.role === "RH") return true;
      return session.department === post.targetDepartment;
    })
    .map((post) => {
      const taggedIds = parseTaggedIds(post.taggedUserIds);
      const reactionSummary = ["like", "love", "idea", "wow", "clap"]
        .map((type) => ({
          type: type as ReactionType,
          count: post.reactions.filter((r) => r.type === type).length,
        }))
        .filter((r) => r.count > 0);

      let poll: FeedPoll | null = null;
      if (post.poll) {
        const totalVotes = post.poll.votes.length;
        poll = {
          id: post.poll.id,
          question: post.poll.question,
          expiresAt: post.poll.expiresAt?.toISOString() ?? null,
          totalVotes,
          userVotedOptionId: session
            ? (post.poll.votes.find((v) => v.userId === session.id)
                ?.optionId ?? null)
            : null,
          options: post.poll.options.map((opt) => {
            const voteCount = post.poll!.votes.filter(
              (v) => v.optionId === opt.id
            ).length;
            return {
              id: opt.id,
              label: opt.label,
              voteCount,
              percent:
                totalVotes > 0
                  ? Math.round((voteCount / totalVotes) * 100)
                  : 0,
            };
          }),
        };
      }

      const viewCount = Math.max(
        post.views.length,
        post.reactions.length + post.comments.length > 0
          ? Math.min(
              totalUsers,
              post.reactions.length +
                post.comments.length +
                Math.floor(post.linkClicks / 2)
            )
          : 0
      );

      return {
        id: post.id,
        title: post.title,
        body: post.body,
        category: post.category,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        attachmentUrl: post.attachmentUrl,
        mediaGallery: parseMediaGallery(post.mediaGallery),
        moodActivity: post.moodActivity,
        location: post.location,
        targetDepartment: post.targetDepartment,
        pinned: post.pinned,
        allowComments: post.allowComments,
        allowReactions: post.allowReactions,
        allowAnonymousComments: post.allowAnonymousComments,
        expiresAt: post.expiresAt?.toISOString() ?? null,
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        linkClicks: post.linkClicks,
        shareCount: post.shareCount,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        taggedUsers: taggedIds
          .map((id) => taggedUsersMap.get(id))
          .filter(Boolean) as FeedTaggedUser[],
        reactionCount: post.reactions.length,
        reactionSummary,
        userReaction: session
          ? ((post.reactions.find((r) => r.userId === session.id)
              ?.type as ReactionType) ?? null)
          : null,
        userSaved: session
          ? Array.isArray(post.saves) && post.saves.length > 0
          : false,
        comments: buildCommentTree(post.comments),
        poll,
        viewCount,
        revisionCount: post.revisions.length,
      };
    });
}

export async function recordPostView(postId: string, userId: string) {
  await prisma.postView.upsert({
    where: { postId_userId: { postId, userId } },
    create: { postId, userId },
    update: {},
  });
}
