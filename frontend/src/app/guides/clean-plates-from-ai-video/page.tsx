import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Get Clean Plates from AI Video",
  description:
    "Stop roto-scoping AI video watermarks. Learn how to extract timeline-ready clean plates from Veo, Sora, and Runway clips for Premiere Pro and DaVinci Resolve.",
  alternates: { canonical: "/guides/clean-plates-from-ai-video" },
  keywords: [
    "clean plates AI video",
    "remove AI video watermark",
    "Veo clean plate",
    "AI video post production",
    "Premiere Pro AI footage",
  ],
  openGraph: {
    title: "How to Get Clean Plates from AI Video — GenClear",
    description: "Automate watermark removal for AI-generated video. Timeline-ready MP4s in minutes.",
    url: `${SITE_URL}/guides/clean-plates-from-ai-video`,
  },
};

export default function CleanPlatesGuidePage() {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <main className="lp container" id="main-content">
        <article>
          <header className="guide-hero">
            <p className="lp-section-label">Workflow guide</p>
            <h1>How to Get Clean Plates from AI Video</h1>
            <p className="section-sub">
              Generative models like Google Veo, OpenAI Sora, and Runway produce stunning footage — but platform overlays and rendering artifacts make the raw output unusable in professional NLEs.
            </p>
          </header>

          <div className="guide-content">
            <h2>The problem with raw AI video</h2>
            <p>
              When you drop a Veo or Gemini clip into Premiere Pro or DaVinci Resolve, you get more than pixels: diamond watermarks, wordmarks, and compression artifacts baked into every frame. VFX artists traditionally spend hours in After Effects with Content-Aware Fill or manual roto-scoping to create clean plates.
            </p>

            <h2>Manual vs automated cleanup</h2>
            <p>
              Content-Aware Fill guesses what pixels should look like — often leaving blur, color shifts, or temporal flicker. GenClear uses reverse-alpha blending to mathematically undo the watermark composite, recovering the original image data instead of inventing new pixels.
            </p>

            <h2>Workflow for editors</h2>
            <ol>
              <li>Export your AI clip as MP4 or MOV (up to 1080p).</li>
              <li>Drop it into GenClear — no account required for your first clean.</li>
              <li>Compare before/after with the interactive slider.</li>
              <li>Download the timeline-ready MP4 and import directly into your NLE.</li>
            </ol>

            <div className="guide-cta card">
              <h3 style={{ marginTop: 0 }}>Try it free — no login</h3>
              <p className="muted">One anonymous clean with before/after compare. Register for 3 monthly credits.</p>
              <Link href="/#upload" className="btn btn-primary btn-lg">Clean a clip now →</Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
