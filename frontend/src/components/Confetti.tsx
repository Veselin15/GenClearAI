"use client";

import { useEffect, useState } from "react";

const COLORS = ["#14b8a6", "#2dd4bf", "#34d399", "#fbbf24", "#60a5fa", "#a78bfa", "#f472b6"];

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; delay: number; color: string; size: number; rotate: number }[]>([]);

  useEffect(() => {
    if (!active) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    setPieces(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      }))
    );
    const t = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div className="confetti-layer" aria-hidden>
      {pieces.map((p) => (
        <i
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            background: p.color,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
