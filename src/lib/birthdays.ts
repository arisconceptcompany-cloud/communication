import { prisma } from "@/lib/prisma";

export type BirthdayPerson = {
  id: string;
  name: string;
  department: string | null;
};

export async function getTodayBirthdays(): Promise<BirthdayPerson[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const users = await prisma.user.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, department: true, birthDate: true },
  });

  return users
    .filter((u) => {
      if (!u.birthDate) return false;
      const b = u.birthDate;
      return b.getMonth() + 1 === month && b.getDate() === day;
    })
    .map(({ id, name, department }) => ({ id, name, department }));
}
