export function ProgressRing({ progress, size = 44 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <svg width={size} height={size} className="progress-ring" aria-hidden>
      <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} />
      <circle
        className="ring-fg"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="ring-text">
        {progress}%
      </text>
    </svg>
  );
}
