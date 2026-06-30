import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-gilroy",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Portail Intranet VALUE-IT",
  description:
    "Portail interne Value-IT — organigramme, RH, hub collaboratif et annonces",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="fr" className={`${inter.variable} ${quicksand.variable}`}>
        <body>{children}</body>
    </html>
  );
}
