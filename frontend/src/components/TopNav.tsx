"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { creditLabel } from "@/lib/api";
import { MobileNav } from "./MobileNav";

interface NavProps {
  user?: User | null;
  variant?: "landing" | "app";
}

export function TopNav({ user, variant = "landing" }: NavProps) {
  if (variant === "landing") {
    return (
      <header className="topbar lp-topbar" role="banner">
        <div className="topbar-inner lp-topbar-inner">
          <Link className="brand" href="/" aria-label="GenClear home">
            <span className="logo" aria-hidden>◈</span> GenClear
          </Link>
          <nav className="nav-links nav-desktop" aria-label="Main navigation">
            <Link href="/#compare">Why us</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/developers">API</Link>
          </nav>
          <div className="nav-right">
            <div className="nav-desktop" style={{ display: "flex", gap: 8 }}>
              <Link className="btn btn-ghost btn-sm" href="/login">Sign in</Link>
              <Link className="btn btn-primary btn-sm" href="/register">Get started</Link>
            </div>
            <MobileNav variant="landing" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <Link className="brand" href="/app" aria-label="GenClear dashboard">
          <span className="logo" aria-hidden>◈</span> GenClear
        </Link>
        <AppNavLinks />
        <div className="nav-right">
          {user && (
            <span className={`pill nav-desktop ${user.plan === "pro" ? "pill-pro" : ""}`}>
              {creditLabel(user)}
            </span>
          )}
          <span className="nav-desktop"><LogoutButton /></span>
          <MobileNav variant="app" userPlan={user ? creditLabel(user) : undefined} />
        </div>
      </div>
    </header>
  );
}

function AppNavLinks() {
  const pathname = usePathname();
  const links = [
    { href: "/app#upload", label: "Upload" },
    { href: "/app", label: "Dashboard" },
    { href: "/account", label: "Account" },
  ];
  return (
    <nav className="nav-links nav-desktop" aria-label="App navigation">
      {links.map((l) => {
        const base = l.href.split("#")[0];
        const active = pathname === base || (base === "/app" && pathname === "/app");
        return (
          <Link
            key={l.href}
            href={l.href}
            style={active && l.label !== "Upload" ? { color: "var(--text)", background: "rgba(255,255,255,.06)" } : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    window.location.href = "/";
  }
  return (
    <button className="btn btn-ghost btn-sm" onClick={logout} type="button">
      Sign out
    </button>
  );
}
