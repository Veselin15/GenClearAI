"use client";

import { useState } from "react";

interface Item { q: string; a: string }

export function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq-accordion">
      {items.map((item, i) => (
        <div key={item.q} className={`faq-row card ${open === i ? "open" : ""}`}>
          <button
            type="button"
            className="faq-q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            <span className="faq-chevron">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="faq-a muted">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
