"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { BrandLink, BrandLogo } from "@/components/BrandLogo";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

import { GoogleAuthButton, AuthDivider } from "@/components/GoogleAuthButton";

const PERKS = [
  "1 free anonymous clean on the homepage",
  "3 monthly credits after sign-up",
  "Google OAuth — 10-second registration",
  "Before/after compare slider",
  "API access on Pro for agency pipelines",
];

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const refCode = searchParams.get("ref");

  useEffect(() => {
    api("/api/me").then(() => router.replace("/app")).catch(() => {});
    emailRef.current?.focus();
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => { if (v) payload[k] = String(v); });
    if (!payload.full_name) delete payload.full_name;

    setLoading(true);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", body: payload });
      router.push("/app");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", "error");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-split-wrap">
        <div className="auth-side card">
          <BrandLogo variant="full" className="auth-side-logo" priority />
          <h2>Remove watermarks.<br />Keep creating.</h2>
          <ul className="auth-perks">
            {PERKS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {mode === "register" && refCode && (
            <p className="pill pill-pro" style={{ marginTop: 16 }}>Referral {refCode.toUpperCase()} applied</p>
          )}
        </div>
        <div className="auth-card card">
          <BrandLink className="brand-auth" />
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="auth-sub">
            {mode === "login" ? "Sign in to continue cleaning clips." : "3 monthly credits — no card needed."}
          </p>
          <GoogleAuthButton label={mode === "register" ? "Sign up with Google" : "Sign in with Google"} />
          <AuthDivider />
          <form onSubmit={onSubmit} noValidate>
            {mode === "register" && (
              <div className="field">
                <label htmlFor="full_name">Name <span className="faint">(optional)</span></label>
                <input type="text" id="full_name" name="full_name" autoComplete="name" placeholder="Your name" />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input ref={emailRef} type="email" id="email" name="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-row">
                <input
                  type={showPw ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "login" ? "Your password" : "Min 8 characters"}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {mode === "register" && refCode && (
              <input type="hidden" name="referral_code" value={refCode.toUpperCase()} />
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create free account"}
            </button>
          </form>
          <p className="auth-foot">
            {mode === "login" ? (
              <>No account? <Link href="/register" className="link-accent">Create one free</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="link-accent">Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthPanel({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <Suspense fallback={
        <div className="auth-page">
          <div className="skeleton skeleton-card" style={{ maxWidth: 420, height: 400, margin: "auto" }} />
        </div>
      }>
        <AuthForm mode={mode} />
      </Suspense>
    </div>
  );
}
