"use client";

import type { User } from "@/lib/types";
import { CardTitle } from "./CardTitle";

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
    <div className="card onboarding-card" role="region" aria-label="Getting started checklist">
      <CardTitle title="Get started" icon="✓" action={<span className="pill">{done}/{steps.length}</span>} />
      <ul className="onboarding-list">
        {steps.map((s) => (
          <li key={s.label} className={s.done ? "done" : ""}>
            <span className="check" aria-hidden>{s.done ? "✓" : "○"}</span>
            {s.href && !s.done ? (
              <a href={s.href} className="link-accent">{s.label}</a>
            ) : (
              <span style={s.done ? { opacity: 0.7 } : undefined}>{s.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
