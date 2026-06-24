"use client";

import { HeroDemo } from "./HeroDemo";

const PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts"];

export function VideoShowcase() {
  return (
    <section className="section lp-showcase">
      <div className="container lp-showcase-inner">
        <div className="lp-showcase-visual">
          <HeroDemo />
          <p className="muted lp-showcase-caption">Veo watermark removed across every frame</p>
        </div>
        <div className="lp-showcase-copy">
          <span className="lp-section-label">Veo &amp; Gemini video</span>
          <h2>Remove the watermark from video — free to start.</h2>
          <p className="muted">
            You wrote the prompt and directed the shot — it&apos;s your content.
            We strip every Veo and Gemini mark so it posts clean, without a visible
            &ldquo;Made with AI&rdquo; label throttling your reach.
          </p>
          <div className="lp-platform-pills">
            {PLATFORMS.map((p) => (
              <span key={p} className="lp-platform-pill">✓ {p}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
