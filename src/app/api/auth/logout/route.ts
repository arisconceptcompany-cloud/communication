import { NextResponse } from "next/server";

export async function POST() {
  return new Response (null, {
    status:302,
    headers: {
      Location: "/login",
      "Set-Cookie": "valueit_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    },
  });
}
