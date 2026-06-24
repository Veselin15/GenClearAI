"use client";

import Link from "next/link";
import { useState } from "react";

const FREE_FEATURES = [
  "3 videos on signup + daily bonus credits",
  "Full 1080p output — same engine as Pro",
  "Live ETA & before/after compare",
  "High-res preview + full MP4 download",
  "Refer friends → +2 credits each",
];

const PRO_FEATURES = [
  "<strong>Unlimited</strong> videos",
  "Same pixel-perfect quality as Free",
  "Priority queue — skip the line",
  "Webhooks & REST API",
  "Creator levels & streak bonuses",
];

export function PricingToggle() {
  const [yearly, setYearly] = useState(false);
  const proPrice = yearly ? 7 : 9;
  const proLabel = yearly ? "/ mo, billed yearly" : "/ month";
  const yearlyTotal = yearly ? 84 : null;

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
          <div className="price">$0<span> / forever</span></div>
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
          <p className="lp-plan-desc muted">For creators and teams shipping AI video every week.</p>
          <div className="price">${proPrice}<span>{proLabel}</span></div>
          {yearlyTotal && <p className="lp-yearly-total muted">${yearlyTotal}/year · cancel anytime</p>}
          <ul>
            {PRO_FEATURES.map((f) => (
              <li key={f} dangerouslySetInnerHTML={{ __html: f }} />
            ))}
          </ul>
          <Link className="btn btn-primary btn-block" href="/register">Get Pro — start free first</Link>
          <p className="lp-plan-guarantee muted">No quality tier — only queue priority &amp; limits change.</p>
        </div>
      </div>
    </>
  );
}
