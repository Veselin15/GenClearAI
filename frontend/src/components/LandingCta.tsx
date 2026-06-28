import Link from "next/link";

export function LandingCta() {
  return (
    <section className="lp-final-cta">
      <div className="lp-final-cta-glow" aria-hidden />
      <div className="container lp-final-cta-inner card">
        <div>
          <h2>Remove your Gemini video watermark in minutes.</h2>
          <p className="muted">
            Scroll up to paste or drop your clip. First clean is free — no login, no credit card.
          </p>
        </div>
        <div className="lp-final-cta-actions">
          <a className="btn btn-primary btn-lg" href="#upload">Upload a video →</a>
          <Link className="btn btn-ghost btn-lg" href="/register">Create free account</Link>
        </div>
      </div>
    </section>
  );
}
