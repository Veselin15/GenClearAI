import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gemini Video Watermark Remove — How-To Guide",
  description:
    "Step-by-step guide to remove Gemini video watermarks. Auto-detect the diamond mark, reverse the alpha blend, and download a clean MP4 — free, no login required.",
  alternates: { canonical: "/guides/gemini-video-watermark-remove" },
  keywords: [
    "gemini video watermark remove",
    "remove gemini video watermark",
    "gemini watermark remover",
    "gemini diamond watermark",
    "remove gemini watermark from video",
    "google gemini video watermark",
  ],
  openGraph: {
    title: "Gemini Video Watermark Remove — GenClear Guide",
    description: "Remove Gemini video watermarks from every frame. Pixel-perfect, not AI inpainting.",
    url: `${SITE_URL}/guides/gemini-video-watermark-remove`,
  },
};

export default function GeminiWatermarkGuidePage() {
  return (
    <div className="lp-shell">
      <TopNav variant="landing" />
      <main className="lp container" id="main-content">
        <article>
          <header className="guide-hero">
            <p className="lp-section-label">Gemini watermark guide</p>
            <h1>Gemini Video Watermark Remove</h1>
            <p className="section-sub">
              Google Gemini stamps a diamond watermark on every video it generates. Here&apos;s how to remove it cleanly — without blur, crop, or generative fill.
            </p>
          </header>

          <div className="guide-content">
            <h2>What is the Gemini video watermark?</h2>
            <p>
              When you generate video with Google Gemini, a small diamond-shaped logo is composited onto every frame. It&apos;s an alpha-blended overlay — not burned into the pixels irreversibly — which means it can be removed mathematically if you know the blend parameters.
            </p>

            <h2>Why most &ldquo;watermark removers&rdquo; fail on Gemini video</h2>
            <p>
              Cropping loses framing. AI inpainting invents new pixels and causes blur or flicker between frames. Content-Aware Fill in After Effects is slow and inconsistent on moving footage. For Gemini video watermark remove workflows, you need frame-by-frame reverse-alpha blending — exactly what GenClear is built for.
            </p>

            <h2>How to remove a Gemini video watermark with GenClear</h2>
            <ol>
              <li>Export or download your Gemini clip as MP4 or MOV (720p or 1080p, landscape or portrait).</li>
              <li>Go to the <Link href="/">GenClear homepage</Link> and drop the file on the upload card — or press Ctrl+V to paste from clipboard.</li>
              <li>GenClear auto-detects the Gemini diamond mark and processes every frame.</li>
              <li>Use the before/after slider to verify the clean output, then download your watermark-free MP4.</li>
            </ol>

            <h2>Why GenClear is the best Gemini video watermark remove tool</h2>
            <ul>
              <li><strong>Automatic detection</strong> — no manual masking or keyframing</li>
              <li><strong>Pixel-exact output</strong> — reverse-alpha blending, not generative fill</li>
              <li><strong>Every frame cleaned</strong> — no flicker or temporal artifacts</li>
              <li><strong>Free to start</strong> — one anonymous clean, no login required</li>
            </ul>

            <div className="guide-cta card">
              <h3 style={{ marginTop: 0 }}>Remove your Gemini watermark now</h3>
              <p className="muted">Drop a clip on the homepage — first clean is free with before/after compare.</p>
              <Link href="/#upload" className="btn btn-primary btn-lg">Gemini video watermark remove →</Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
