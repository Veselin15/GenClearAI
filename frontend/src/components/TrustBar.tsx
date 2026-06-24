const ITEMS = [
  { icon: "🔒", label: "Private sandbox", sub: "No internet during processing" },
  { icon: "⚡", label: "Under 3 min", sub: "Typical 30–60s clips" },
  { icon: "🎯", label: "Pixel-exact", sub: "No generative fill" },
  { icon: "🔄", label: "Instant replay", sub: "Same file, zero wait" },
];

export function TrustBar() {
  return (
    <section className="lp-trustbar">
      <div className="container lp-trustbar-inner">
        {ITEMS.map((item) => (
          <div key={item.label} className="lp-trustbar-item">
            <span className="lp-trustbar-icon">{item.icon}</span>
            <div>
              <b>{item.label}</b>
              <span className="muted">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
