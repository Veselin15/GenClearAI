"use client";

import { LandingUpload } from "./LandingUpload";
import { StatsStrip } from "./StatsStrip";

export function LandingHero() {
  return (
    <section className="lp-hero lp-hero-centered">
      <div className="lp-hero-glow" aria-hidden />
      <div className="container lp-hero-stack">
        <p className="lp-hero-eyebrow" role="doc-subtitle">Gemini video watermark remove free · no sign-up</p>
        <h1 className="lp-hero-title">
          Gemini Video Watermark Remove — <span className="lp-title-accent">Free &amp; Flawless</span>
        </h1>
        <p className="lp-hero-subtitle">Drop your clip → download clean. No account. No card.</p>
        <p className="lp-hero-desc muted">
          That ◆ diamond on every Gemini frame? Gone in minutes — we reverse the blend, not repaint it.
          Upload, scrub the before/after slider, export a watermark-free MP4. Veo supported. First clean is free.
        </p>

        <div id="upload" className="lp-upload-wrap">
          <LandingUpload />
        </div>

        <StatsStrip />
      </div>
    </section>
  );
}
