import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import { getAuthSecretKey } from "./auth-secret";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "valueit_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
};

function getSecret() {
  return getAuthSecretKey();
}

export async function createSessionCookie(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const maxAge = 60 * 60 * 24 * 7;
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export async function destroySession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      department: (payload.department as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function verifyCredentials(email: string, password: string) {
  const isAllowed = require("./email-utils").isAllowedEmail;
  if (!isAllowed(email)) {
    return { error: "Accès réservé aux comptes Value-IT internes." };
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { error: "Identifiants incorrects." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Identifiants incorrects." };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    } satisfies SessionUser,
  };
}

export function isRhOrAdmin(role: Role): boolean {
  return role === "RH" || role === "ADMIN";
}