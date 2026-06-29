"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatPrice,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY_PER_MONTH,
  PRO_PRICE_YEARLY_TOTAL,
} from "@/lib/pricing";

const FREE_FEATURES = [
  "1 free anonymous clean — no signup",
  "3 monthly credits after registration",
  "Full 1080p output — same engine as Pro",
  "Live ETA & before/after compare",
  "Google sign-in · personal workspace",
];

const PRO_FEATURES = [
  "<strong>Unlimited</strong> videos",
  "Priority queue — skip the line",
  "Webhooks & REST API for pipelines",
  "0-hour data retention — instant purge",
  "Batch rendering for agency workflows",
];

export function PricingToggle() {
  const [yearly, setYearly] = useState(false);
  const proPrice = yearly ? PRO_PRICE_YEARLY_PER_MONTH : PRO_PRICE_MONTHLY;
  const proLabel = yearly ? "/ mo, billed yearly" : "/ month";

  return (
    <>
      <div className="pricing-toggle">
        <button type="button" className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>Monthly</button>
        <button type="button" className={yearly ? "active" : ""} onClick={() => setYearly(true)}>
          Yearly <span className="save-tag">Save 22%</span>
        </button>
      </div>
      <p className="pricing-quality-note muted center">
        Free and Pro use the <b>identical</b> processing pipeline — Pro only adds speed &amp; volume.
      </p>
      <div className="pricing lp-pricing-grid">
        <div className="card plan">
          <h3>Free</h3>
          <p className="lp-plan-desc muted">Try GenClear with full-quality output.</p>
          <div className="price">{formatPrice(0)}<span> / month</span></div>
          <ul>
            {FREE_FEATURES.map((f) => (
              <li key={f} dangerouslySetInnerHTML={{ __html: f }} />
            ))}
          </ul>
          <Link className="btn btn-ghost btn-block" href="/register">Create free account</Link>
        </div>
        <div className="card plan featured">
          <span className="pill pill-pro tag">Most popular</span>
          <h3>Pro</h3>
          <p className="lp-plan-desc muted">For agencies and teams shipping AI video to clients every week.</p>
          <div className="price">{formatPrice(proPrice)}<span>{proLabel}</span></div>
          {yearly && (
            <p className="lp-yearly-total muted">
              {formatPrice(PRO_PRICE_YEARLY_TOTAL)}/year · cancel anytime
            </p>
          )}
          <ul>
            {PRO_FEATURES.map((f) => (
              <li key={f} dangerouslySetInnerHTML={{ __html: f }} />
            ))}
          </ul>
          <Link className="btn btn-primary btn-block" href="/register">Get Pro</Link>
          <p className="lp-plan-guarantee muted">No quality tier — only queue priority &amp; limits change.</p>
        </div>
      </div>
    </>
  );
}
