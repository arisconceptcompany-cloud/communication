import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function hashClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const salt = process.env.AUTH_SECRET || "valueit-lan";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 24);
}

export async function isChatBanned(sessionId: string, ipHash: string) {
  const now = new Date();
  const sessionFilters = sessionId ? [{ sessionId }, { ipHash }] : [{ ipHash }];
  const ban = await prisma.chatBan.findFirst({
    where: {
      AND: [
        { OR: sessionFilters },
        { OR: [{ until: null }, { until: { gt: now } }] },
      ],
    },
  });
  return Boolean(ban);
}
