import { prisma } from "@/lib/prisma";

export type BirthdayPerson = {
  id: string;
  name: string;
  department: string | null;
};

/** Message d'accueil déterministe, identique sur le serveur et le navigateur. */
export function birthdayGreeting(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `Joyeux anniversaire ${names[0]} !`;
  if (names.length === 2) {
    return `Joyeux anniversaire à ${names[0]} et ${names[1]} !`;
  }
  return `Joyeux anniversaire à ${names.slice(0, -1).join(", ")} et ${
    names[names.length - 1]
  } !`;
}

export async function getTodayBirthdays(): Promise<BirthdayPerson[]> {
  const now = new Date();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const [users, employees] = await Promise.all([
    prisma.user.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, name: true, department: true, birthDate: true },
    }),
    prisma.employeeBirthday.findMany({
      select: { id: true, fullName: true, birthDate: true },
    }),
  ]);

  const fromUsers = users
    .filter((u) => {
      if (!u.birthDate) return false;
      const b = u.birthDate;
      return b.getMonth() + 1 === now.getMonth() + 1 && b.getDate() === now.getDate();
    })
    .map(({ id, name, department }) => ({ id, name, department }));

  const fromEmployees = employees
    .filter((employee) => employee.birthDate.slice(5) === monthDay)
    .map((employee) => ({
      id: employee.id,
      name: employee.fullName,
      department: null,
    }));

  // Évite un doublon si un collaborateur est présent dans les deux sources.
  const seen = new Set<string>();
  return [...fromUsers, ...fromEmployees].filter((person) => {
    const key = person.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
