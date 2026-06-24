"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@/lib/types";
import { api, fmtDate, getUserSummary } from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { CardTitle } from "@/components/CardTitle";
import { CreatorLevel } from "@/components/CreatorLevel";
import { useToast } from "@/components/Toast";
import type { UserSummary } from "@/lib/types";

export default function AccountPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<UserSummary | null>(null);

  useEffect(() => {
    Promise.all([
      api<User>("/api/me"),
      getUserSummary().catch(() => null),
    ])
      .then(([u, s]) => { setUser(u); if (s) setSummary(s); })
      .catch(() => { window.location.href = "/login"; })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <div className="app-shell">
        <div className="topbar skeleton" style={{ height: 56, borderRadius: 0 }} />
        <PageLoader />
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = { full_name: String(fd.get("full_name") || "") };
    const pw = String(fd.get("password") || "");
    if (pw) body.password = pw;
    try {
      const updated = await api<User>("/api/me", { method: "PATCH", body });
      setUser(updated);
      toast("Profile saved", "ok");
      (e.target as HTMLFormElement).querySelector<HTMLInputElement>("[name=password]")!.value = "";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function genKey() {
    try {
      const { api_key } = await api<{ api_key: string }>("/api/me/api-key", { method: "POST" });
      setApiKey(api_key);
      setUser((u) => u ? { ...u, has_api_key: true } : u);
      toast("API key generated — copy it now, it won't be shown again", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function copyRef() {
    const link = user?.referral_code
      ? `${window.location.origin}/register?ref=${user.referral_code}`
      : "";
    try {
      await navigator.clipboard.writeText(link);
      toast("Referral link copied", "ok");
    } catch {
      toast("Press Ctrl+C to copy", "info");
    }
  }

  async function copyKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      toast("API key copied", "ok");
    } catch {
      toast("Press Ctrl+C to copy", "info");
    }
  }

  const refLink = user.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${user.referral_code}`
    : "—";

  return (
    <div className="app-shell">
      <TopNav user={user} variant="app" />
      <main className="page container">
        <PageHeader title="Account" subtitle="Manage your profile, plan, API access, and referrals." />

        <CreatorLevel user={user} />

        {summary && summary.finished_jobs > 0 && (
          <div className="summary-strip" style={{ marginTop: 16 }}>
            <div className="summary-chip">
              <b>{summary.finished_jobs}</b>
              <span>clips cleaned</span>
            </div>
            <div className="summary-chip">
              <b>{summary.cache_hits}</b>
              <span>cache hits</span>
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginTop: 24 }}>
          <div className="stack">
            <div className="card">
              <CardTitle title="Profile" icon="👤" />
              <form onSubmit={saveProfile}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled aria-label="Email address (read-only)" />
                </div>
                <div className="field">
                  <label htmlFor="full_name">Name</label>
                  <input type="text" id="full_name" name="full_name" defaultValue={user.full_name ?? ""} placeholder="Your name" />
                </div>
                <div className="field">
                  <label htmlFor="password">New password</label>
                  <input type="password" id="password" name="password" minLength={8} placeholder="Leave blank to keep current" autoComplete="new-password" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </form>
            </div>

            <div className="card">
              <CardTitle title="API access" icon="🔌" subtitle="For scripts and automation" />
              <p className="muted" style={{ fontSize: ".92rem", marginBottom: 14 }}>
                {user.has_api_key
                  ? "An API key is active. Generating a new one replaces it."
                  : "No API key yet — generate one for programmatic access."}
              </p>
              <button className="btn btn-ghost" onClick={genKey} type="button">
                {user.has_api_key ? "Rotate API key" : "Generate API key"}
              </button>
              {apiKey && (
                <div style={{ marginTop: 14 }}>
                  <div className="code" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{apiKey}</span>
                    <button className="btn btn-ghost btn-sm" onClick={copyKey} type="button" style={{ flexShrink: 0 }}>Copy</button>
                  </div>
                  <div className="hint">Use as <code>Authorization: Bearer &lt;key&gt;</code>. Shown once.</div>
                </div>
              )}
              <p style={{ marginTop: 16, marginBottom: 0 }}>
                <Link href="/developers" className="link-accent">View API docs →</Link>
              </p>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <CardTitle title="Subscription" icon="◈" />
              <div className="kv"><span className="k">Plan</span><span>{user.plan === "pro" ? "Pro" : "Free"}</span></div>
              <div className="kv"><span className="k">Credits</span><span>{user.plan === "pro" ? "Unlimited" : user.credits}</span></div>
              <div className="kv"><span className="k">Streak</span><span>{user.streak_days} day{user.streak_days === 1 ? "" : "s"}</span></div>
              <div className="kv"><span className="k">Videos cleaned</span><span>{user.videos_processed}</span></div>
              <div className="kv"><span className="k">Member since</span><span>{fmtDate(user.created_at)}</span></div>
              {user.plan !== "pro" && (
                <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => setShowUpgrade(true)} type="button">
                  Upgrade to Pro
                </button>
              )}
              {user.badges.length > 0 && (
                <div className="badges-row" style={{ marginTop: 14 }}>
                  {user.badges.map((b) => (
                    <span key={b.id} className="pill" title={b.desc}>{b.title}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <CardTitle title="Refer friends" icon="🎁" subtitle="+2 credits each" />
              <p className="muted" style={{ fontSize: ".92rem" }}>Share your link — you both get bonus credits when they join.</p>
              <div className="referral">
                <input type="text" readOnly value={refLink} aria-label="Referral link" />
                <button className="btn btn-primary btn-sm" onClick={copyRef} type="button">Copy</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showUpgrade && (
        <div className="modal-bg" onClick={() => setShowUpgrade(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
            <CardTitle title="Upgrade to Pro" icon="🚀" />
            <p className="muted">
              Unlimited videos, priority queue, webhooks and API access for $9/month.
              Payment processing is coming soon to this instance.
            </p>
            <button className="btn btn-ghost btn-block" onClick={() => setShowUpgrade(false)} type="button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
