import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Remove AI Video Artifacts",
  description:
    "Fix rendering artifacts, platform overlays, and visual bugs in AI-generated video. Automated cleanup for Veo, Sora, and Runway footage — ready for client deliverables.",
  alternates: { canonical: "/guides/remove-ai-video-artifacts" },
  keywords: [
    "remove AI video artifacts",
    "AI video cleanup",
    "fix AI generated video",
    "Veo artifacts",
    "AI video quality",
  ],
  openGraph: {
    title: "Remove AI Video Artifacts — GenClear",
    description: "Automated artifact removal for AI-generated video. Ship client-ready footage.",
    url: `${SITE_URL}/guides/remove-ai-video-artifacts`,
  },
};

export default function RemoveArtifactsGuidePage() {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <main className="lp container" id="main-content">
        <article>
          <header className="guide-hero">
            <p className="lp-section-label">Technical guide</p>
            <h1>Remove AI Video Artifacts Automatically</h1>
            <p className="section-sub">
              Platform-imposed UI overlays, compression blocks, and watermark composites aren&apos;t just cosmetic — they break professional post-production pipelines.
            </p>
          </header>

          <div className="guide-content">
            <h2>Common artifacts in generative video</h2>
            <ul>
              <li><strong>Watermark overlays</strong> — Gemini diamond marks and Veo wordmarks on every frame</li>
              <li><strong>Alpha compositing residue</strong> — halos and edge artifacts around removed elements</li>
              <li><strong>Resolution drift</strong> — tools that shrink frames below source resolution</li>
            </ul>

            <h2>Why inpainting fails</h2>
            <p>
              Generative inpainting creates new pixels that don&apos;t match adjacent frames, causing temporal inconsistency that clients notice immediately. Reverse-alpha blending preserves the original sensor data encoded before the watermark was applied.
            </p>

            <h2>GenClear for agencies</h2>
            <p>
              Pro and Agency tiers include priority queue processing, REST API access for pipeline integration, and a strict 0-hour data retention policy — files are purged immediately after download for client privacy.
            </p>

            <div className="guide-cta card">
              <h3 style={{ marginTop: 0 }}>See the difference instantly</h3>
              <p className="muted">Drop a clip on our homepage. Interactive before/after slider, one free download.</p>
              <Link href="/#upload" className="btn btn-primary btn-lg">Remove artifacts →</Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
