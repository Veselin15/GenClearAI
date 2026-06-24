"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/types";

export function CompareModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [pos, setPos] = useState(50);
  const [loaded, setLoaded] = useState(0);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 2));
      if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 2));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setPos(Math.round(x * 100));
  }, [dragging]);

  const ready = loaded >= 2;
  const w = job.output_width || job.width || 16;
  const h = job.output_height || job.height || 9;
  const res = job.output_width && job.output_height
    ? `${job.output_width}×${job.output_height}`
    : job.width && job.height
      ? `${job.width}×${job.height}`
      : null;

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Before and after comparison">
      <div className="modal wide card modal-compare">
        <div className="modal-head">
          <div>
            <h3>Before / After</h3>
            {res && (
              <p className="muted" style={{ margin: "4px 0 0", fontSize: ".82rem" }}>
                {res} output
                {job.quality_matched && <span className="tag-quality"> · resolution preserved</span>}
              </p>
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-sm modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="muted" style={{ fontSize: ".86rem", marginBottom: 14 }}>
          Drag the slider to compare. Right side plays your <b>actual cleaned MP4</b>.
        </p>
        <div
          ref={containerRef}
          className="compare compare-video"
          style={{ "--pos": `${pos}%`, "--aspect": `${w} / ${h}`, cursor: dragging ? "ew-resize" : undefined } as React.CSSProperties}
          onPointerDown={() => setDragging(true)}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          {!ready && (
            <div className="compare-loading">
              <div className="spinner" />
              <span className="muted">Loading preview…</span>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="img-before"
            src={`/v1/jobs/${job.id}/thumb/before`}
            alt="Original frame with watermark"
            onLoad={() => setLoaded((n) => n + 1)}
            style={{ opacity: ready ? 1 : 0 }}
          />
          {job.download_url ? (
            <video
              className="img-after"
              src={job.download_url}
              muted
              playsInline
              loop
              autoPlay
              onLoadedData={() => setLoaded((n) => n + 1)}
              style={{ opacity: ready ? 1 : 0 }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="img-after"
              src={`/v1/jobs/${job.id}/thumb/after`}
              alt="Cleaned frame without watermark"
              onLoad={() => setLoaded((n) => n + 1)}
              style={{ opacity: ready ? 1 : 0 }}
            />
          )}
          <div className="divider" />
          <div className="handle">⇄</div>
          <span className="cmp-label l">BEFORE</span>
          <span className="cmp-label r">AFTER</span>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            disabled={!ready}
            aria-label="Comparison slider position"
            onChange={(e) => setPos(Number(e.target.value))}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {job.download_url && (
            <a className="btn btn-primary" href={job.download_url} style={{ flex: 1 }}>Download clean video</a>
          )}
          <button className="btn btn-ghost" style={{ flex: job.download_url ? 0 : 1 }} onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
