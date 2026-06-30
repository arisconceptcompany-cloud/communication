import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isRhOrAdmin } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isRhOrAdmin(session.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const deletedIdea = await prisma.ideaSubmission.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      message: "Idée supprimée avec succès",
      deletedIdea
    });
  } catch (error) {
    console.error("[IdeaBox] Erreur suppression :", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}