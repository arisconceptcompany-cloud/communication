import { NextResponse } from "next/server";
import { createSessionCookie, verifyCredentials } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const result = await verifyCredentials(
    parsed.data.email.toLowerCase(),
    parsed.data.password
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const cookie = await createSessionCookie(result.user);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookie);
  return res;
}
