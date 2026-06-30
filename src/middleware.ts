import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "valueit_session";

const PUBLIC_PATHS = ["/login", "/hub", "/idees", "/messagerie"];
const RH_PATHS: string[] = [];
const API_PUBLIC = ["/api/chat", "/api/idees"];

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    return new TextEncoder().encode("__invalid__");
  }
  return new TextEncoder().encode(
    secret || "dev-valueit-intranet-secret-change-me-prod"
  );
}

async function getRoleFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role as string;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  if (API_PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const role = await getRoleFromRequest(request);

  if (!role && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (RH_PATHS.some((p) => pathname.startsWith(p))) {
    if (role !== "RH" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
