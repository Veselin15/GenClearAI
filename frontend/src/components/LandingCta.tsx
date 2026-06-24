import Link from "next/link";

export function LandingCta() {
  return (
    <section className="lp-final-cta">
      <div className="lp-final-cta-glow" aria-hidden />
      <div className="container lp-final-cta-inner card">
        <div>
          <h2>Your next clip could be watermark-free in minutes.</h2>
          <p className="muted">
            Scroll up to paste or drop your video. Free account with 3 videos — no credit card.
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
