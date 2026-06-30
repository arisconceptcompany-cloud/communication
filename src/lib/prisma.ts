import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient & { __pragmasSet?: boolean };
};

function ensurePragmas(client: PrismaClient) {
  const c = client as PrismaClient & { __pragmasSet?: boolean };
  if (c.__pragmasSet) return;
  c.__pragmasSet = true;
  c.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
  c.$queryRawUnsafe("PRAGMA busy_timeout=5000;").catch(() => {});
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return new Proxy(client, {
    get(target, prop, receiver) {
      ensurePragmas(target);
      return Reflect.get(target, prop, receiver);
    },
  }) as PrismaClient;
}

function getClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !("chatTyping" in cached)) {
    void (cached as PrismaClient).$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = getClient();
