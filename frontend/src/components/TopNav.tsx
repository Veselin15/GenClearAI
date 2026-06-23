import Link from "next/link";
import type { User } from "@/lib/types";
import { creditLabel } from "@/lib/api";

interface NavProps {
  user?: User | null;
  variant?: "landing" | "app";
}

export function TopNav({ user, variant = "landing" }: NavProps) {
  if (variant === "landing") {
    return (
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="logo">◈</span> GenClear
          </Link>
          <div className="nav-right">
            <Link className="btn btn-ghost btn-sm" href="/login">Sign in</Link>
            <Link className="btn btn-primary btn-sm" href="/register">Get started</Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/app">
          <span className="logo">◈</span> GenClear
        </Link>
        <nav className="nav-links">
          <Link href="/app">Dashboard</Link>
          <Link href="/account">Account</Link>
        </nav>
        <div className="nav-right">
          {user && (
            <span className={`pill ${user.plan === "pro" ? "pill-pro" : ""}`}>
              {creditLabel(user)}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
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
