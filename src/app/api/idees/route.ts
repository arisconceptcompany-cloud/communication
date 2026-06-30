import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendIdeaBoxEmail } from "@/lib/mail";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3).max(150),
  category: z.string().min(1),
  body: z.string().min(10).max(10000),
});

export async function POST(request: Request) {
  // 1. Parse du body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide (JSON attendu)" }, { status: 400 });
  }

  // 2. Validation Zod
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Formulaire incomplet", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 3. Sauvegarde en base
  try {
    await prisma.ideaSubmission.create({ data: parsed.data });
  } catch (err) {
    console.error("[IdeaBox] Erreur Prisma :", err);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde en base de données." },
      { status: 500 }
    );
  }

  // 4. Envoi e-mail (non bloquant : une erreur mail ne fait pas échouer la requête)
  let simulated = false;
  try {
    const mailResult = await sendIdeaBoxEmail(parsed.data);
    simulated = mailResult.simulated;
  } catch (err) {
    console.warn("[IdeaBox] Envoi e-mail échoué (non bloquant) :", err);
    // On ne renvoie pas 500 : l'idée est déjà sauvegardée
  }

  return NextResponse.json({ ok: true, simulated });
}