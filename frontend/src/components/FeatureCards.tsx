const CARDS = [
  {
    icon: "◆",
    title: "Gemini diamond, gone",
    desc: "Purpose-built for Gemini video watermark remove — the diamond mark is detected and lifted from every frame, not painted over.",
  },
  {
    icon: "▶",
    title: "Every frame, clean",
    desc: "No flicker, no smears. Reverse alpha blending keeps motion smooth from first frame to last.",
  },
  {
    icon: "◎",
    title: "Pixel-perfect quality",
    desc: "Same resolution and bitrate out as in. Compare before/after before you download or ship to a client.",
  },
];

export function FeatureCards() {
  return (
    <section className="section lp-feature-cards">
      <div className="container">
        <div className="lp-fc-grid">
          {CARDS.map((c) => (
            <article key={c.title} className="card lp-fc-card">
              <span className="lp-fc-free">Free</span>
              <div className="lp-fc-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p className="muted">{c.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
