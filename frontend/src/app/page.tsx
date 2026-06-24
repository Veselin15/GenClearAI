import Link from "next/link";
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

const FAQ = [
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
    a: "Gemini diamond marks and the Veo wordmark — landscape or portrait, 720p and 1080p. Detection is fully automatic on upload.",
  },
  {
    q: "Is my content private?",
    a: "Yes. Files are processed in an isolated sandbox with no outbound internet. Results auto-delete after 48 hours unless you download them.",
  },
  {
    q: "Do I need to sign up?",
    a: "You can pick a file without an account, but processing requires a free account (3 videos included, no credit card). Sign-up takes about 10 seconds.",
  },
];

export default function HomePage() {
  return (
    <div className="lp-shell">
      <AnnouncementBar />
      <TopNav variant="landing" />
      <ActivityTicker />
      <main className="lp">
        <LandingHero />
        <FeatureCards />
        <QualityPledge />
        <VideoShowcase />

        <section className="section container lp-problem-banner">
          <h2 className="center">The Gemini watermark is on everything you make.</h2>
          <p className="section-sub">GenClear removes it so your work looks finished — ready for TikTok, Reels, and client deliverables.</p>
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
