import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteFooter() {
  return (
    <footer className="footer site-footer lp-footer">
      <div className="container footer-grid">
        <div className="lp-footer-brand">
          <div className="brand brand-footer" style={{ marginBottom: 12 }}>
            <BrandLogo variant="full" />
          </div>
          <p className="muted" style={{ margin: 0, fontSize: ".88rem", maxWidth: 300, lineHeight: 1.6 }}>
            The fastest Gemini video watermark remove tool.
            Pixel-perfect output for creators, agencies, and filmmakers.
          </p>
        </div>
        <div className="footer-links">
          <strong className="lp-footer-heading">Product</strong>
          <Link href="/register">Get started</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <div className="footer-links">
          <strong className="lp-footer-heading">Guides</strong>
          <Link href="/guides/gemini-video-watermark-remove">Gemini video watermark remove</Link>
          <Link href="/guides/clean-plates-from-ai-video">Clean plates from AI video</Link>
          <Link href="/guides/remove-ai-video-artifacts">Remove AI artifacts</Link>
          <Link href="/guides/automate-content-aware-fill-ai-video">Automate Content-Aware Fill</Link>
        </div>
        <div className="footer-links">
          <strong className="lp-footer-heading">Developers</strong>
          <Link href="/developers">API reference</Link>
          <a href="/docs" target="_blank" rel="noopener noreferrer">Swagger UI</a>
          <Link href="/login">Sign in</Link>
        </div>
        <div className="footer-links">
          <strong className="lp-footer-heading">Legal</strong>
          <span className="muted">Files auto-delete after 48h</span>
          <span className="muted">Isolated processing sandbox</span>
          <a href="https://github.com/allenk/VeoWatermarkRemover" target="_blank" rel="noopener noreferrer">
            Open-source engine
          </a>
        </div>
      </div>
      <div className="container footer-copy">
        © {new Date().getFullYear()} GenClear · Built for creators who ship
      </div>
    </footer>
  );
}
