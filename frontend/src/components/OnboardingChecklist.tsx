"use client";

import type { User } from "@/lib/types";

export function OnboardingChecklist({ user }: { user: User }) {
  const o = user.onboarding;
  if (!o || o.complete) return null;

  const steps = [
    { done: o.upload_first, label: "Upload your first clip", href: "#upload" },
    { done: o.download_result, label: "Download a cleaned video" },
    { done: o.share_referral, label: "Share your referral link", href: "/account" },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <div className="card onboarding-card">
      <div className="onboarding-head">
        <h3>Get started</h3>
        <span className="pill">{done}/{steps.length} done</span>
      </div>
      <ul className="onboarding-list">
        {steps.map((s) => (
          <li key={s.label} className={s.done ? "done" : ""}>
            <span className="check">{s.done ? "✓" : "○"}</span>
            {s.href && !s.done ? <a href={s.href}>{s.label}</a> : <span>{s.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
