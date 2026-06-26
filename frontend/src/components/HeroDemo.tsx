"use client";

import { CompareSlider } from "./CompareSlider";

function DemoScene({ watermark = false }: { watermark?: boolean }) {
  return (
    <div className="demo-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="demo-scene-art" src="/demo/scene.svg" alt="" draggable={false} />
      <div className="demo-scene-vignette" />
      <div className="demo-scene-grain" />
      <div className="demo-scene-scanlines" />
      {watermark && (
        <div className="demo-watermark-stack" aria-hidden>
          <div className="demo-watermark-gem">◆</div>
          <span className="demo-watermark-veo">Veo</span>
        </div>
      )}
    </div>
  );
}

/** Interactive before/after watermark removal demo on the landing page. */
export function HeroDemo() {
  return (
    <div className="hero-demo card lp-hero-demo">
      <div className="hero-demo-labels">
        <span className="lp-demo-badge lp-demo-before">WATERMARKED</span>
        <span className="lp-demo-badge lp-demo-after">CLEAN</span>
      </div>

      <CompareSlider
        className="hero-demo-slider"
        aspectRatio="16 / 10"
        defaultPosition={46}
        labels={{ before: "BEFORE", after: "AFTER" }}
        before={<DemoScene watermark />}
        after={<DemoScene />}
        caption={
          <p className="muted hero-demo-caption">
            Drag the slider — real clips, same pixel-perfect engine.
          </p>
        }
      />
    </div>
  );
}
