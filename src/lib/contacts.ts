export type Contact = {
  name: string;
  role: string;
  phone: string;
  email: string;
};

export const USEFUL_CONTACTS: Contact[] = [
  {
    name: "RAJAONARIVONY Josiane Mandimbisoa",
    role: "Co-gérante",
    phone: "032 11 734 44",
    email: "jrajaonarivony@outsourcia-group.com",
  },
  {
    name: "RAKOTOSOA Marie Renée",
    role: "Responsable des Ressources Humaines",
    phone: "032 11 734 43",
    email: "mrakotosoa@outsourcia-group.com",
  },
  {
    name: "ROBISON Tiffany Vaniah",
    role: "Assistante administrative et des Ressources Humaines",
    phone: "032 11 734 40",
    email: "trobison@outsourcia-group.com",
  },
];

export function isContactsDoc(title: string): boolean {
  return /contact/i.test(title);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
