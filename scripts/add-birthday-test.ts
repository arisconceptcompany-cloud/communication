import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_RECORDS = [
  {
    matricule: "TEST-ANIV-1",
    fullName: "Test Anniversaire Alpha",
    birthDate: "1990-11-27",
  },
  {
    matricule: "TEST-ANIV-2",
    fullName: "Test Anniversaire Beta",
    birthDate: "1990-11-27",
  },
];

const TEST_MATRICULES = TEST_RECORDS.map((record) => record.matricule);

async function main() {
  if (process.argv.includes("--remove")) {
    const result = await prisma.employeeBirthday.deleteMany({
      where: { matricule: { in: TEST_MATRICULES } },
    });
    console.log(`${result.count} employé(s) test supprimé(s).`);
    return;
  }

  for (const record of TEST_RECORDS) {
    await prisma.employeeBirthday.upsert({
      where: { matricule: record.matricule },
      update: record,
      create: record,
    });
  }

  const records = await prisma.employeeBirthday.findMany({
    where: { matricule: { in: TEST_MATRICULES } },
    orderBy: { matricule: "asc" },
  });

  console.log("Employés tests enregistrés :");
  for (const record of records) {
    console.log(
      `- ${record.matricule} | ${record.fullName} | ${record.birthDate}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
