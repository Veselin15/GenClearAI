import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Automate After Effects Content-Aware Fill for AI Video",
  description:
    "Replace hours of manual Content-Aware Fill and roto-scoping with automated AI video cleanup. Get timeline-ready plates from Veo and Gemini in minutes.",
  alternates: { canonical: "/guides/automate-content-aware-fill-ai-video" },
  keywords: [
    "automate content aware fill",
    "After Effects AI video",
    "replace content aware fill",
    "AI video roto scope",
    "automated watermark removal",
  ],
  openGraph: {
    title: "Automate Content-Aware Fill for AI Video — GenClear",
    description: "Skip manual masking. Automated clean plates for AI-generated footage.",
    url: `${SITE_URL}/guides/automate-content-aware-fill-ai-video`,
  },
};

export default function ContentAwareFillGuidePage() {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <main className="lp container" id="main-content">
        <article>
          <header className="guide-hero">
            <p className="lp-section-label">VFX workflow</p>
            <h1>Automate After Effects Content-Aware Fill for AI Video</h1>
            <p className="section-sub">
              The old workflow: import AI clip → mask watermark → Content-Aware Fill → pray it doesn&apos;t flicker → repeat for 1,800 frames. There&apos;s a faster way.
            </p>
          </header>

          <div className="guide-content">
            <h2>When Content-Aware Fill makes sense</h2>
            <p>
              For static logos on live-action footage, AE&apos;s Content-Aware Fill works well. But AI video watermarks are applied via alpha compositing across every frame — inpainting each frame independently produces inconsistent results that fail client QC.
            </p>

            <h2>The automated alternative</h2>
            <p>
              GenClear&apos;s rendering engine detects watermark type automatically (Gemini diamond, Veo wordmark) and reverses the blend operation frame-by-frame. Output matches source resolution with no generative guessing.
            </p>

            <h2>Time savings</h2>
            <p>
              A 60-second 1080p clip that takes 2–4 hours to roto manually processes in 1–3 minutes on GenClear. Re-uploading identical files is instant thanks to content-addressed caching.
            </p>

            <h2>Integration with your NLE</h2>
            <p>
              Download a clean MP4 and drop it directly into Premiere Pro, DaVinci Resolve, or Final Cut. Pro users get API access to automate this step in agency pipelines.
            </p>

            <div className="guide-cta card">
              <h3 style={{ marginTop: 0 }}>Replace hours of masking</h3>
              <p className="muted">Try free — no account for your first clip. Before/after slider included.</p>
              <Link href="/#upload" className="btn btn-primary btn-lg">Automate cleanup →</Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
