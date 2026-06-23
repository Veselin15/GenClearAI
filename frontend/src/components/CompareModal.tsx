"use client";

import { useState } from "react";

export function CompareModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [pos, setPos] = useState(50);

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide card">
        <h3>Before / After</h3>
        <p className="muted" style={{ fontSize: ".88rem", marginBottom: 14 }}>
          Drag to compare — left is the original, right is cleaned.
        </p>
        <div className="compare" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="img-before" src={`/v1/jobs/${jobId}/thumb/before`} alt="before" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="img-after" src={`/v1/jobs/${jobId}/thumb/after`} alt="after" />
          <div className="divider" />
          <div className="handle">⇄</div>
          <span className="cmp-label l">BEFORE</span>
          <span className="cmp-label r">AFTER</span>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            aria-label="comparison slider"
            onChange={(e) => setPos(Number(e.target.value))}
          />
        </div>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}
