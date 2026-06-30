import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  optionId: z.string().min(1),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const poll = await prisma.postPoll.findFirst({
    where: { postId: id },
    include: { options: true, votes: true },
  });

  if (!poll) {
    return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
  }

  if (poll.expiresAt && poll.expiresAt < new Date()) {
    return NextResponse.json({ error: "Sondage expiré" }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Vote invalide" }, { status: 400 });
  }

  if (!poll.options.some((o) => o.id === parsed.data.optionId)) {
    return NextResponse.json({ error: "Option invalide" }, { status: 400 });
  }

  const existing = await prisma.postPollVote.findUnique({
    where: { pollId_userId: { pollId: poll.id, userId: session.id } },
  });

  if (existing) {
    await prisma.postPollVote.update({
      where: { id: existing.id },
      data: { optionId: parsed.data.optionId },
    });
  } else {
    await prisma.postPollVote.create({
      data: {
        pollId: poll.id,
        optionId: parsed.data.optionId,
        userId: session.id,
      },
    });
  }

  const votes = await prisma.postPollVote.findMany({
    where: { pollId: poll.id },
  });
  const totalVotes = votes.length;

  const options = poll.options.map((opt) => {
    const voteCount = votes.filter((v) => v.optionId === opt.id).length;
    return {
      id: opt.id,
      label: opt.label,
      voteCount,
      percent: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
    };
  });

  return NextResponse.json({
    totalVotes,
    userVotedOptionId: parsed.data.optionId,
    options,
  });
}
