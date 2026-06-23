"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

function RegisterForm() {
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
      await api("/api/auth/register", { method: "POST", body: payload });
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
        <h1>Create your account</h1>
        <p className="auth-sub">Start with 3 free videos — no card required.</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="full_name">Name (optional)</label>
            <input type="text" id="full_name" name="full_name" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required minLength={8} autoComplete="new-password" />
          </div>
          {refCode && (
            <div className="field">
              <label htmlFor="referral_code">Referral code</label>
              <input type="text" id="referral_code" name="referral_code" defaultValue={refCode.toUpperCase()} readOnly />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-foot">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
