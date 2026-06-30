import type { Role } from "@prisma/client";

export function isRhOrAdmin(role: Role) {
  return role === "RH" || role === "ADMIN";
}
