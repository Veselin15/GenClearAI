const ROWS = [
  { label: "Video logo removal", us: true, other: true },
  { label: "Removes from every frame", us: true, other: false },
  { label: "Pixel-exact (no AI fill)", us: true, other: false },
  { label: "Live progress & ETA", us: true, other: false },
  { label: "Before / after compare", us: true, other: false },
  { label: "API & webhooks", us: true, other: false },
  { label: "Free tier", us: true, other: false },
];

export function ComparisonSection() {
  return (
    <section id="compare" className="section lp-compare">
      <div className="container">
        <h2 className="center">How GenClear compares</h2>
        <p className="section-sub">
          Other Gemini video watermark remove tools blur, crop, or repaint.
          GenClear reverses the blend — mathematically exact, every frame.
        </p>
        <div className="lp-compare-simple card">
          <div className="lp-compare-simple-head">
            <span />
            <span>Other tools</span>
            <span className="lp-col-brand">GenClear</span>
          </div>
          {ROWS.map((row) => (
            <div key={row.label} className="lp-compare-simple-row">
              <span>{row.label}</span>
              <span className={row.other ? "lp-check" : "lp-cross"}>{row.other ? "✓" : "—"}</span>
              <span className="lp-check lp-col-brand">✓</span>
            </div>
          ))}
          <div className="lp-compare-simple-row lp-compare-price">
            <span>Price</span>
            <span className="muted">Paid</span>
            <span className="lp-price-free">Free to start</span>
          </div>
        </div>
      </div>
    </section>
  );
}
