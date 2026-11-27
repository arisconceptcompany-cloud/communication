import { z } from "zod";

/** Date civile au format ISO court : aucune timezone, aucun risque #418. */
export const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidBirthDate(value: string): boolean {
  if (!BIRTH_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const birthdayInputSchema = z.object({
  matricule: z
    .string()
    .trim()
    .min(1, "Le matricule est requis")
    .max(50, "Matricule trop long"),
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom est requis")
    .max(200, "Nom trop long"),
  birthDate: z
    .string()
    .trim()
    .regex(BIRTH_DATE_PATTERN, "Format attendu : AAAA-MM-JJ")
    .refine(isValidBirthDate, "Date de naissance invalide"),
});

export type BirthdayInput = z.infer<typeof birthdayInputSchema>;

export type BirthdayRecord = {
  id: string;
  matricule: string;
  fullName: string;
  birthDate: string;
};

/** Format d'affichage déterministe (fonctionne côté serveur comme côté client). */
export function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
