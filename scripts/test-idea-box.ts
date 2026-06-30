/**
 * Vérifie la boîte à idées : envoi email (simulé sans SMTP) + persistance Prisma.
 * Usage : npm run test:idees
 */
import { PrismaClient } from "@prisma/client";
import { sendIdeaBoxEmail } from "../src/lib/mail";

const prisma = new PrismaClient();

const fixture = {
  title: "Test automatisé boîte à idées",
  category: "outil",
  body: "Message de test généré par scripts/test-idea-box.ts — à ignorer.",
};

async function main() {
  const prevHost = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;

  const mailResult = await sendIdeaBoxEmail(fixture);
  if (!mailResult.ok || !mailResult.simulated) {
    throw new Error(
      `sendIdeaBoxEmail : attendu ok + simulated, reçu ${JSON.stringify(mailResult)}`
    );
  }
  console.log("✓ sendIdeaBoxEmail (mode simulé sans SMTP)");

  if (prevHost) process.env.SMTP_HOST = prevHost;

  const row = await prisma.ideaSubmission.create({ data: fixture });
  const found = await prisma.ideaSubmission.findUnique({ where: { id: row.id } });
  if (!found || found.title !== fixture.title) {
    throw new Error("Persistance Prisma : enregistrement introuvable");
  }
  await prisma.ideaSubmission.delete({ where: { id: row.id } });
  console.log("✓ Persistance Prisma (create + delete)");

  console.log("\nTous les tests boîte à idées ont réussi.");
}

main()
  .catch((err) => {
    console.error("✗", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
