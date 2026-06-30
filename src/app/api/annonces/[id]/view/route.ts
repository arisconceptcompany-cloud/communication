import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordPostView } from "@/lib/feed";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  await recordPostView(id, session.id);
  return NextResponse.json({ ok: true });
}
