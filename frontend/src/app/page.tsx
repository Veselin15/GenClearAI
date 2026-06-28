import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { ActivityTicker } from "@/components/ActivityTicker";
import { SiteFooter } from "@/components/SiteFooter";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PricingToggle } from "@/components/PricingToggle";
import { LandingHero } from "@/components/LandingHero";
import { FeatureCards } from "@/components/FeatureCards";
import { VideoShowcase } from "@/components/VideoShowcase";
import { ComparisonSection } from "@/components/ComparisonSection";
import { LandingCta } from "@/components/LandingCta";
import { QualityPledge } from "@/components/QualityPledge";
import { StructuredData } from "@/components/StructuredData";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: "Gemini Video Watermark Remove | GenClear — Free & Pixel-Perfect",
  },
  description:
    "Gemini video watermark remove free — strip the diamond mark from every frame in minutes. No login, no credit card. Upload, compare before/after, download clean MP4.",
  keywords: [
    "gemini video watermark remove",
    "gemini video watermark remove free",
    "remove gemini video watermark free",
    "remove gemini video watermark",
    "gemini watermark remover",
    "gemini diamond watermark video",
    "remove gemini watermark from video",
    "google gemini video watermark",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Gemini Video Watermark Remove — GenClear",
    description: "Remove Gemini video watermarks from every frame. Auto-detect, reverse alpha blend, download clean MP4. Start free.",
    url: SITE_URL,
  },
};

const FAQ = [
  {
    q: "Is gemini video watermark remove free?",
    a: "Yes — your first clean is completely free with full before/after compare and high-res download. No account, no credit card, no watermark on the export. Register free for 3 monthly credits after that.",
  },
  {
    q: "How do I remove a Gemini video watermark?",
    a: "Upload your Gemini-generated MP4 to GenClear — drag it onto the upload card or press Ctrl+V to paste from clipboard. We auto-detect the diamond watermark on every frame, reverse the alpha blend, and give you a clean download. No login required for your first clean.",
  },
  {
    q: "Can GenClear remove the Gemini diamond watermark from video?",
    a: "Yes — Gemini video watermark removal is what GenClear does best. The diamond mark is detected automatically on upload and removed frame by frame using reverse-alpha blending, not AI inpainting. Works on landscape and portrait clips at 720p and 1080p.",
  },
  {
    q: "Can I paste a video instead of browsing?",
    a: "Yes. Copy a video file to your clipboard (or screen-record a clip) and press Ctrl+V anywhere on the landing page while the Video tab is selected.",
  },
  {
    q: "How is this different from AI inpainting?",
    a: "Inpainting generates new pixels and often leaves blur or color shifts. GenClear reverses the watermark's alpha blend mathematically — you get back the original image data, not a guess.",
  },
  {
    q: "How long does processing take?",
    a: "Most 30–60 second clips finish in 1–3 minutes. Re-uploading the same file is instant thanks to content-addressed caching.",
  },
  {
    q: "What watermarks do you support?",
    a: "Gemini diamond marks (our specialty) and the Veo wordmark — landscape or portrait, 720p and 1080p. Detection is fully automatic on upload.",
  },
  {
    q: "Is my content private?",
    a: "Yes. Files are processed in an isolated sandbox with no outbound internet. Results auto-delete after 48 hours unless you download them.",
  },
  {
    q: "Do I need to sign up?",
    a: "No — drop a clip on the homepage for one free anonymous clean with before/after compare. Register with Google or email for a personal workspace and 3 monthly credits.",
  },
  {
    q: "How does the free tier work?",
    a: "Anonymous users get one free high-res download. Registered free accounts receive 3 credits per month, resetting on the 1st. Pro unlocks unlimited processing, API access, and priority queue.",
  },
];

export default function HomePage() {
  return (
    <div className="lp-shell">
      <StructuredData faq={FAQ} />
      <AnnouncementBar />
      <TopNav variant="landing" />
      <ActivityTicker />
      <main className="lp" id="main-content">
        <LandingHero />
        <FeatureCards />
        <QualityPledge />
        <VideoShowcase />

        <section className="section container lp-problem-banner">
          <h2 className="center">Gemini puts a watermark on every video you generate.</h2>
          <p className="section-sub">
            GenClear removes the Gemini video watermark from every frame — pixel-perfect, no blur —
            so your clips are ready for TikTok, Reels, and client deliverables.
          </p>
        </section>

        <ComparisonSection />

        <section id="how" className="section container">
          <h2 className="center">How it works</h2>
          <p className="section-sub">Drop or paste your clip on this page. We handle the rest.</p>
          <div className="steps lp-steps">
            <div className="card step">
              <div className="num">1</div>
              <h3>Paste or drop</h3>
              <p>MP4, MOV, MKV, or WebM — drag onto the upload card or Ctrl+V from your clipboard.</p>
            </div>
            <div className="card step">
              <div className="num">2</div>
              <h3>We clean every frame</h3>
              <p>Auto-detect the mark, reverse the alpha blend, export a pixel-perfect MP4.</p>
            </div>
            <div className="card step">
              <div className="num">3</div>
              <h3>Download &amp; post</h3>
              <p>Compare before/after on your dashboard, then download or automate via API.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="section container lp-pricing">
          <h2 className="center">Simple pricing</h2>
          <p className="section-sub">Start free on the upload above. Upgrade when volume picks up.</p>
          <PricingToggle />
        </section>

        <section id="faq" className="section container faq-section">
          <h2 className="center">FAQ</h2>
          <FaqAccordion items={FAQ} />
        </section>

        <LandingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
