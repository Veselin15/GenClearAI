import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { StatsStrip } from "@/components/StatsStrip";

const FAQ = [
  {
    q: "How long does processing take?",
    a: "Most 30–60 second clips finish in about 1–3 minutes on our hardware. Re-uploading the same file is instant thanks to content caching.",
  },
  {
    q: "What watermarks do you support?",
    a: "Gemini diamond marks and the new small \"Veo\" wordmark — landscape or portrait, 720p and 1080p. Detection is fully automatic.",
  },
  {
    q: "Is quality lost?",
    a: "No generative AI, no repainting. We use reverse alpha blending — mathematically exact pixel recovery, not guesswork.",
  },
  {
    q: "What happens to my files?",
    a: "Processed in an isolated sandbox with no internet access. Results auto-delete after 48 hours unless you download them.",
  },
];

export default function HomePage() {
  return (
    <>
      <TopNav variant="landing" />
      <main>
        <section className="hero container">
          <span className="eyebrow">AI watermark removal</span>
          <h1>
            Clean <span className="grad">Veo &amp; Gemini</span> watermarks in minutes.
          </h1>
          <p>
            Upload, watch live progress, download a pixel-perfect MP4.
            No settings, no flags — we detect the watermark and remove it with exact math.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" href="/register">Start free — 3 videos</Link>
            <Link className="btn btn-ghost btn-lg" href="/login">Sign in</Link>
          </div>
          <StatsStrip />
        </section>

        <section className="section container">
          <h2>Built for speed &amp; simplicity</h2>
          <p className="section-sub">No command-line tools. No guessing settings. Just results.</p>
          <div className="features">
            <div className="card feature">
              <div className="ico">⚡</div>
              <h3>Instant replays</h3>
              <p>Upload the same clip twice? The second time is instant — we cache by file fingerprint.</p>
            </div>
            <div className="card feature">
              <div className="ico">📡</div>
              <h3>Live progress</h3>
              <p>Watch every stage: queue position, ETA, watermark removal %, and a ping when it&apos;s done.</p>
            </div>
            <div className="card feature">
              <div className="ico">⇄</div>
              <h3>Before / after</h3>
              <p>Drag-to-compare preview so you can verify the clean result before you download.</p>
            </div>
          </div>
        </section>

        <section className="section container">
          <h2>How it works</h2>
          <p className="section-sub">Three steps. Under two minutes for most clips.</p>
          <div className="steps">
            <div className="card step">
              <div className="num">1</div>
              <h3>Upload</h3>
              <p>Drop your clip. We validate format, resolution, and fingerprint it for instant cache hits.</p>
            </div>
            <div className="card step">
              <div className="num">2</div>
              <h3>We process</h3>
              <p>Auto-detect watermark type, remove with reverse alpha blending, export a clean MP4.</p>
            </div>
            <div className="card step">
              <div className="num">3</div>
              <h3>Download</h3>
              <p>Grab the result, compare side-by-side, share your referral link for bonus credits.</p>
            </div>
          </div>
        </section>

        <section className="section container">
          <h2>Simple pricing</h2>
          <p className="section-sub">Start free. Upgrade when volume picks up.</p>
          <div className="pricing">
            <div className="card plan">
              <h3>Free</h3>
              <div className="price">$0<span> / forever</span></div>
              <ul>
                <li>3 videos to start + daily bonus credits</li>
                <li>720p &amp; 1080p support</li>
                <li>Live ETA &amp; progress</li>
                <li>Refer friends → +2 credits each</li>
              </ul>
              <Link className="btn btn-ghost btn-block" href="/register">Create free account</Link>
            </div>
            <div className="card plan featured">
              <span className="pill pill-pro tag">Popular</span>
              <h3>Pro</h3>
              <div className="price">$9<span> / month</span></div>
              <ul>
                <li>Unlimited videos</li>
                <li>Priority queue — skip the line</li>
                <li>Webhooks &amp; API access</li>
                <li>Before/after previews</li>
              </ul>
              <Link className="btn btn-primary btn-block" href="/register">Get started</Link>
            </div>
          </div>
        </section>

        <section className="section container faq-section">
          <h2>FAQ</h2>
          <div className="faq-grid">
            {FAQ.map((item) => (
              <div key={item.q} className="card faq-item">
                <h3>{item.q}</h3>
                <p className="muted" style={{ margin: 0, fontSize: ".94rem" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container">GenClear · built on the open-source VeoWatermarkRemover engine</div>
      </footer>
    </>
  );
}
