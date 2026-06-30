import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  return NextResponse.json({ session });
}
