"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { GlobalSearch } from "./GlobalSearch";
import {
  Home,
  Megaphone,
  FolderOpen,
  Bell,
  Lightbulb,
  Radio,
  Network,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const NAV_ICONS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/organigramme", label: "Organigramme", icon: Network },
  { href: "/rh", label: "Espace RH", icon: Radio },
  { href: "/hub", label: "Hub", icon: FolderOpen },
  { href: "/annonces", label: "Annonces", icon: Megaphone },
  { href: "/idees", label: "Idées", icon: Lightbulb },
];

type Props = {
  user: SessionUser | null;
  notificationCount?: number;
};

export function TopBar({ user, notificationCount = 0 }: Props) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="top-bar top-bar--corporate">
      <div className="top-bar-left">
        <Link
          href="/"
          className="top-bar-brand"
        >
          <img
            src="logo-valueit.png"
            alt="Value-IT"
            className="top-bar-brand-logo"
            width={120}
            height={40}
          />
          <span className="top-bar-brand-text-wrap">
            <span className="top-bar-brand-sub">Portail</span>
            <span className="top-bar-brand-main">Intranet</span>
          </span>
        </Link>
      </div>

      <div className="top-bar-search-center">
        <GlobalSearch />
      </div>

      <nav className="top-bar-center" aria-label="Accès rapide">
        {NAV_ICONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`top-bar-icon-link ${isActive(item.href) ? "active" : ""}`}
              title={item.label}
            >
              <Icon size={20} aria-hidden />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="top-bar-right">
        {user ? (
          <>
            <Link
              href="/notifications"
              className="top-bar-notif"
              title="Alertes RH"
              aria-label={`${notificationCount} alerte(s) RH`}
            >
              <Bell size={20} aria-hidden />
              {notificationCount > 0 && (
                <span className="top-bar-notif-badge">{notificationCount}</span>
              )}
            </Link>
            <Link href="/parametres" className="top-bar-profile">
              <span className="top-bar-profile-avatar" aria-hidden>
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </span>
              <span className="top-bar-profile-name">
                {user.name.split(" ")[0]}
              </span>
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="top-bar-logout" title="Déconnexion">
               
                <span>Déconnexion</span>
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Connexion
          </Link>
        )}

        <button
          className="top-bar-hamburger"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileNavOpen && (
        <>
          <div className="top-bar-mobile-overlay" onClick={() => setMobileNavOpen(false)} />
          <nav className="top-bar-mobile-nav" aria-label="Navigation mobile">
            <div className="top-bar-mobile-search">
              <GlobalSearch />
            </div>
            {NAV_ICONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`top-bar-mobile-link ${isActive(item.href) ? "active" : ""}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {user && (
              <form action="/api/auth/logout" method="POST" className="top-bar-mobile-logout">
                <button type="submit" className="top-bar-mobile-link">
                  <LogOut size={20} />
                  <span>Déconnexion</span>
                </button>
              </form>
            )}
          </nav>
        </>
      )}
    </header>
  );
}