"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { api, fmtDate } from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { useToast } from "@/components/Toast";

export default function AccountPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>("/api/me")
      .then(setUser)
      .catch(() => { window.location.href = "/login"; })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) return null;

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = { full_name: String(fd.get("full_name") || "") };
    const pw = String(fd.get("password") || "");
    if (pw) body.password = pw;
    try {
      const updated = await api<User>("/api/me", { method: "PATCH", body });
      setUser(updated);
      toast("Profile saved", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
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

  const refLink = user.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${user.referral_code}`
    : "—";

  return (
    <>
      <TopNav user={user} variant="app" />
      <main className="page container">
        <div className="page-head"><h1>Account</h1></div>
        <div className="grid-2">
          <div className="stack">
            <div className="card">
              <h3 style={{ fontSize: "1.1rem" }}>Profile</h3>
              <form onSubmit={saveProfile}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled />
                </div>
                <div className="field">
                  <label htmlFor="full_name">Name</label>
                  <input type="text" id="full_name" name="full_name" defaultValue={user.full_name ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="password">New password</label>
                  <input type="password" id="password" name="password" minLength={8} placeholder="Leave blank to keep current" />
                </div>
                <button type="submit" className="btn btn-primary">Save changes</button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "1.1rem" }}>API access</h3>
              <p className="muted" style={{ fontSize: ".92rem" }}>
                {user.has_api_key
                  ? "An API key is active. Generating a new one replaces it."
                  : "No API key yet — generate one for programmatic access."}
              </p>
              <button className="btn btn-ghost" onClick={genKey} type="button">
                {user.has_api_key ? "Rotate API key" : "Generate API key"}
              </button>
              {apiKey && (
                <div style={{ marginTop: 14 }}>
                  <div className="code">{apiKey}</div>
                  <div className="hint">Use as <code>Authorization: Bearer &lt;key&gt;</code>. Shown once.</div>
                </div>
              )}
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <h3 style={{ fontSize: "1.1rem" }}>Subscription</h3>
              <div className="kv"><span className="k">Plan</span><span>{user.plan === "pro" ? "Pro" : "Free"}</span></div>
              <div className="kv"><span className="k">Credits</span><span>{user.plan === "pro" ? "Unlimited" : user.credits}</span></div>
              <div className="kv"><span className="k">Streak</span><span>{user.streak_days} day{user.streak_days === 1 ? "" : "s"}</span></div>
              <div className="kv"><span className="k">Videos cleaned</span><span>{user.videos_processed}</span></div>
              <div className="kv"><span className="k">Member since</span><span>{fmtDate(user.created_at)}</span></div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => setShowUpgrade(true)} type="button">
                Upgrade to Pro — skip the queue
              </button>
              {user.badges.length > 0 && (
                <div className="badges-row" style={{ marginTop: 14 }}>
                  {user.badges.map((b) => (
                    <span key={b.id} className="pill" title={b.desc}>{b.title}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: "1.1rem" }}>Refer friends 🎁</h3>
              <p className="muted" style={{ fontSize: ".92rem" }}>Share your link — you both get bonus credits when they join.</p>
              <div className="referral">
                <input type="text" readOnly value={refLink} />
                <button className="btn btn-ghost" onClick={copyRef} type="button">Copy</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showUpgrade && (
        <div className="modal-bg" onClick={() => setShowUpgrade(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Upgrade to Pro</h3>
            <p className="muted">
              Unlimited videos, priority queue, webhooks and API access for $9/month.
              Checkout isn&apos;t connected yet on this instance — payment processing is coming soon.
            </p>
            <button className="btn btn-ghost btn-block" onClick={() => setShowUpgrade(false)} type="button">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
