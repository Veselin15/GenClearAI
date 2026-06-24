"use client";

import { processingPhase } from "@/lib/api";
import type { JobStatus } from "@/lib/types";

const STEPS = [
  { icon: "📥", label: "Ingesting", min: 0 },
  { icon: "🔍", label: "Detecting mark", min: 10 },
  { icon: "🧮", label: "Reversing blend", min: 25 },
  { icon: "📤", label: "Exporting MP4", min: 80 },
];

export function ProcessingTheatre({
  status,
  progress,
  filename,
}: {
  status: JobStatus;
  progress: number;
  filename: string;
}) {
  if (status !== "pending" && status !== "processing") return null;

  const phase = processingPhase(status, progress);
  const activeIdx = STEPS.reduce((acc, s, i) => (progress >= s.min ? i : acc), 0);

  return (
    <div className="processing-theatre card" role="status" aria-label={`Processing ${filename}: ${progress}%`}>
      <div className="processing-theatre-head">
        <span className="live-dot" aria-hidden />
        <div>
          <strong>{phase}</strong>
          <p className="muted" style={{ margin: 0, fontSize: ".82rem" }}>{filename}</p>
        </div>
        <span className="processing-theatre-pct">{progress}%</span>
      </div>
      <div className="processing-theatre-steps">
        {STEPS.map((s, i) => (
          <div key={s.label} className={`pt-step ${i <= activeIdx ? "active" : ""} ${i === activeIdx ? "current" : ""}`}>
            <span className="pt-icon" aria-hidden>{s.icon}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div
        className="progress"
        style={{ marginTop: 12 }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${Math.max(progress, status === "pending" ? 4 : 10)}%` }} />
      </div>
    </div>
  );
}
