const CASES = [
  {
    icon: "🎬",
    title: "Indie filmmakers",
    desc: "Polish AI-generated B-roll and test shots before festivals or client deliverables — without visible watermarks.",
    tag: "Deliverables",
  },
  {
    icon: "📱",
    title: "Content creators",
    desc: "Turn Veo and Gemini clips into publish-ready Reels, Shorts, and TikToks. Same file uploads are instant on replay.",
    tag: "Social",
  },
  {
    icon: "🏢",
    title: "Agencies & brands",
    desc: "Batch-clean client assets via API, webhooks, and priority queue. Your team stays in the browser.",
    tag: "Scale",
  },
];

export function UseCasesSection() {
  return (
    <section className="section lp-usecases">
      <div className="container">
        <span className="lp-section-label">Who it&apos;s for</span>
        <h2>Built for anyone shipping AI video.</h2>
        <p className="section-sub">From solo creators to teams processing dozens of clips a week.</p>
        <div className="lp-usecase-grid">
          {CASES.map((c) => (
            <article key={c.title} className="card lp-usecase">
              <span className="lp-usecase-tag">{c.tag}</span>
              <div className="ico">{c.icon}</div>
              <h3>{c.title}</h3>
              <p className="muted">{c.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
