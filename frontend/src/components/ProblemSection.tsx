const PAINS = [
  {
    problem: "Watermarks kill credibility",
    detail: "A visible Veo or Gemini mark tells everyone the clip is unfinished — clients notice.",
  },
  {
    problem: "Generative fill ruins shots",
    detail: "Inpainting tools smear textures and shift colors. Fine for memes, not for paid work.",
  },
  {
    problem: "Manual editing doesn't scale",
    detail: "Masking frame-by-frame or cropping loses composition. Hours per clip add up fast.",
  },
];

export function ProblemSection() {
  return (
    <section className="section lp-problem">
      <div className="container lp-problem-grid">
        <div className="lp-problem-copy">
          <span className="lp-section-label">The problem</span>
          <h2>AI video is incredible.<br />The watermark isn&apos;t.</h2>
          <p className="muted">
            You generated the perfect shot. Then Google stamped it.
            You need a clean master — fast, lossless, and repeatable.
          </p>
        </div>
        <ul className="lp-pain-list">
          {PAINS.map((p) => (
            <li key={p.problem} className="card">
              <span className="lp-pain-x">✕</span>
              <div>
                <h3>{p.problem}</h3>
                <p className="muted">{p.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
