"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  variant: "landing" | "app";
  userPlan?: string;
}

export function MobileNav({ variant, userPlan }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = variant === "landing"
    ? [
        { href: "/#compare", label: "Why us" },
        { href: "/#pricing", label: "Pricing" },
        { href: "/developers", label: "API" },
        { href: "/login", label: "Sign in" },
        { href: "/register", label: "Sign up", primary: true },
      ]
    : [
        { href: "/app", label: "Dashboard" },
        { href: "/account", label: "Account" },
        { href: "/developers", label: "API docs" },
      ];

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    window.location.href = "/";
  }

  return (
    <>
      <button
        type="button"
        className="nav-burger"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>
      {open && (
        <div className="mobile-drawer" onClick={() => setOpen(false)}>
          <nav className="mobile-drawer-panel card" onClick={(e) => e.stopPropagation()}>
            {userPlan && <span className="pill pill-pro" style={{ marginBottom: 12 }}>{userPlan}</span>}
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={l.primary ? "btn btn-primary btn-block" : "mobile-link"}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {variant === "app" && (
              <button type="button" className="mobile-link" style={{ textAlign: "left", background: "none", border: "none", font: "inherit", cursor: "pointer", color: "var(--muted)" }} onClick={logout}>
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
