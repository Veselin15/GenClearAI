"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { useToast } from "./Toast";
import { CardTitle } from "./CardTitle";

export function ReferralCard({ user }: { user: User }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  if (!user.referral_code) return null;

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${user.referral_code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Referral link copied — you both get +2 credits!", "ok");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed — select the link manually", "error");
    }
  }

  return (
    <div className="card referral-card">
      <CardTitle title="Earn free credits" icon="🎁" subtitle="+2 each when friends join" />
      <p className="muted" style={{ fontSize: ".9rem", marginBottom: 12 }}>
        Invite a creator — you <b>both</b> get 2 bonus credits.
        {user.referral_count > 0 && ` (${user.referral_count} joined so far)`}
      </p>
      <div className="referral">
        <input type="text" readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()} />
        <button className="btn btn-primary btn-sm" type="button" onClick={copy}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
