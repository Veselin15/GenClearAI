"use client";

import { HeroDemo } from "./HeroDemo";

const PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts"];

export function VideoShowcase() {
  return (
    <section className="section lp-showcase">
      <div className="container lp-showcase-inner">
        <div className="lp-showcase-visual">
          <HeroDemo />
          <p className="muted lp-showcase-caption">Gemini video watermark removed across every frame</p>
        </div>
        <div className="lp-showcase-copy">
          <span className="lp-section-label">Gemini video watermark remove</span>
          <h2>The best way to remove Gemini watermarks from video.</h2>
          <p className="muted">
            Every Gemini clip ships with that diamond mark baked into every frame.
            GenClear strips it cleanly — landscape or portrait, 720p or 1080p — so your
            TikToks, Reels, and client deliverables look finished, not &ldquo;Made with AI.&rdquo;
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
