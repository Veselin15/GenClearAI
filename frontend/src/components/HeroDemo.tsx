"use client";

import { useState } from "react";

/** Interactive mock of before/after watermark removal on the landing page. */
export function HeroDemo() {
  const [pos, setPos] = useState(52);

  return (
    <div className="hero-demo card lp-hero-demo">
      <div className="hero-demo-labels">
        <span className="lp-demo-badge lp-demo-before">WATERMARKED</span>
        <span className="lp-demo-badge lp-demo-after">CLEAN</span>
      </div>
      <div className="hero-demo-frame" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
        <div className="mock-scene mock-before">
          <div className="mock-sky" />
          <div className="mock-ground" />
          <div className="mock-film-grain" />
          <div className="mock-watermark diamond">◆</div>
          <span className="mock-veo">Veo</span>
        </div>
        <div className="mock-scene mock-after">
          <div className="mock-sky" />
          <div className="mock-ground" />
          <div className="mock-film-grain" />
        </div>
        <div className="hero-demo-divider" />
        <div className="hero-demo-handle">⇄</div>
        <input
          type="range"
          min={8}
          max={92}
          value={pos}
          aria-label="Compare watermark removal"
          onChange={(e) => setPos(Number(e.target.value))}
        />
      </div>
      <p className="muted hero-demo-caption">Drag the slider — real clips, same pixel-perfect engine.</p>
    </div>
  );
}
