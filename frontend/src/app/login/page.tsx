"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const refCode = searchParams.get("ref");

  useEffect(() => {
    api("/api/me")
      .then(() => router.replace("/app"))
      .catch(() => {});
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
    <div className="auth-wrap">
      <div className="auth-card card">
        <Link className="brand" href="/">
          <span className="logo">◈</span> GenClear
        </Link>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to your account to keep processing."
            : "Start with 3 free videos — no card required."}
        </p>
        <form onSubmit={onSubmit}>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="full_name">Name (optional)</label>
              <input type="text" id="full_name" name="full_name" autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          {mode === "register" && refCode && (
            <div className="field">
              <label htmlFor="referral_code">Referral code</label>
              <input
                type="text"
                id="referral_code"
                name="referral_code"
                defaultValue={refCode.toUpperCase()}
                readOnly
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? (mode === "login" ? "Signing in…" : "Creating account…")
              : (mode === "login" ? "Sign in" : "Create account")}
          </button>
        </form>
        <p className="auth-foot">
          {mode === "login" ? (
            <>No account? <Link href="/register">Create one free</Link></>
          ) : (
            <>Already have an account? <Link href="/login">Sign in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
