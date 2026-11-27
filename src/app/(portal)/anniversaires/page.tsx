import { BirthdayManager } from "@/components/birthdays/BirthdayManager";
import { getSession, isRhOrAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Liste des employés — VALUE-IT",
};

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/anniversaires");
  }
  if (!isRhOrAdmin(session.role)) {
    redirect("/");
  }

  return <BirthdayManager />;
}
