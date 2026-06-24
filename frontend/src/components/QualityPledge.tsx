export function QualityPledge() {
  return (
    <section className="quality-pledge">
      <div className="container quality-pledge-inner card">
        <div className="quality-pledge-icon" aria-hidden>◎</div>
        <div>
          <h3>Same quality on Free &amp; Pro</h3>
          <p className="muted" style={{ margin: 0, fontSize: ".92rem", lineHeight: 1.6 }}>
            No resolution downgrades. No watermark on exports. We verify every output matches your
            upload dimensions — if the engine drifts, we repair it automatically.
          </p>
        </div>
        <ul className="quality-pledge-list">
          <li>Full 1080p preserved</li>
          <li>High-res compare previews</li>
          <li>Identical processing pipeline</li>
        </ul>
      </div>
    </section>
  );
}
