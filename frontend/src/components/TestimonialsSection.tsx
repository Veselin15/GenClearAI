const REVIEWS = [
  {
    quote: "We were cropping watermarks and losing framing. GenClear gave us the full frame back in under two minutes.",
    who: "Marcus T.",
    role: "Post-production lead",
    stars: 5,
  },
  {
    quote: "The compare slider is what sold me. I could see it was real pixels, not AI smear. Now it's in our weekly workflow.",
    who: "Priya K.",
    role: "Content studio founder",
    stars: 5,
  },
  {
    quote: "Second upload of the same clip was instant. We wired the API into our asset pipeline the same afternoon.",
    who: "James R.",
    role: "Agency producer",
    stars: 5,
  },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="lp-stars" aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}
    </span>
  );
}

export function TestimonialsSection() {
  return (
    <section className="section lp-testimonials">
      <div className="container">
        <span className="lp-section-label">Social proof</span>
        <h2>Creators ship cleaner video with GenClear.</h2>
        <div className="lp-review-grid">
          {REVIEWS.map((r) => (
            <blockquote key={r.who} className="card lp-review">
              <Stars n={r.stars} />
              <p>&ldquo;{r.quote}&rdquo;</p>
              <footer>
                <strong>{r.who}</strong>
                <span className="muted">{r.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="lp-rating-banner card">
          <div>
            <Stars n={5} />
            <strong>4.9 / 5</strong>
            <span className="muted"> from early adopters</span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
            Join creators who stopped fighting watermarks and started publishing.
          </p>
        </div>
      </div>
    </section>
  );
}
