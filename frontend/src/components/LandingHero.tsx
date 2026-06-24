"use client";

import { LandingUpload } from "./LandingUpload";
import { StatsStrip } from "./StatsStrip";

export function LandingHero() {
  return (
    <section className="lp-hero lp-hero-centered">
      <div className="lp-hero-glow" aria-hidden />
      <div className="container lp-hero-stack">
        <p className="lp-hero-eyebrow" role="doc-subtitle">The best Veo &amp; Gemini watermark remover · 2026</p>
        <h1 className="lp-hero-title">
          Veo <span className="lp-title-accent">Watermark</span> Remover
        </h1>
        <p className="lp-hero-subtitle">Free for video — paste or drop below</p>
        <p className="lp-hero-desc muted">
          Upload a Veo or Gemini clip and get a clean MP4 in minutes.
          Pixel-exact reverse alpha blending — not generative fill. No command line, no settings, no quality loss.
        </p>

        <div id="upload" className="lp-upload-wrap">
          <LandingUpload />
        </div>

        <StatsStrip />
      </div>
    </section>
  );
}
