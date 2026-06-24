export function ProductPreview() {
  return (
    <section className="section lp-product">
      <div className="container">
        <span className="lp-section-label">The product</span>
        <h2>Everything you need in one dashboard.</h2>
        <p className="section-sub">
          Live progress, before/after compare, download links, API keys, and referral credits —
          no desktop app, no CLI.
        </p>
        <div className="lp-preview-frame">
          <div className="lp-preview-chrome">
            <span /><span /><span />
            <span className="lp-preview-url">genclear.app/dashboard</span>
          </div>
          <div className="lp-preview-body">
            <div className="lp-preview-sidebar">
              <div className="lp-preview-card">
                <div className="lp-preview-label">Credits</div>
                <div className="lp-preview-big">3</div>
                <div className="lp-preview-sub muted">+1 daily bonus</div>
              </div>
              <div className="lp-preview-card lp-preview-drop">
                <div className="lp-preview-drop-icon">⬆</div>
                <div>Drop your Veo clip</div>
                <div className="muted" style={{ fontSize: ".75rem" }}>MP4 · up to 1080p</div>
              </div>
            </div>
            <div className="lp-preview-main">
              <div className="lp-preview-card">
                <div className="lp-preview-row">
                  <span className="lp-preview-filename">brand_teaser_veo.mp4</span>
                  <span className="badge s-finished">Finished</span>
                </div>
                <div className="lp-preview-bar"><i style={{ width: "100%" }} /></div>
                <div className="lp-preview-actions">
                  <span className="btn btn-ghost btn-sm">Compare</span>
                  <span className="btn btn-primary btn-sm">Download</span>
                </div>
              </div>
              <div className="lp-preview-card lp-preview-active">
                <div className="lp-preview-row">
                  <span className="lp-preview-filename">social_gemini_9x16.mp4</span>
                  <span className="badge s-processing">Processing</span>
                </div>
                <div className="lp-preview-bar"><i style={{ width: "67%" }} /></div>
                <div className="muted" style={{ fontSize: ".78rem" }}>Removing watermark · ready in ~90s</div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-preview-features">
          <div><b>Live ETA</b><span className="muted">Know exactly when it&apos;s done</span></div>
          <div><b>Compare slider</b><span className="muted">Verify before you ship</span></div>
          <div><b>API &amp; webhooks</b><span className="muted">Automate your pipeline</span></div>
        </div>
      </div>
    </section>
  );
}
