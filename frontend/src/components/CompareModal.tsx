"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { CompareSlider } from "./CompareSlider";

export function CompareModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ready = loaded >= 2;
  const w = job.output_width || job.width || 16;
  const h = job.output_height || job.height || 9;
  const res = job.output_width && job.output_height
    ? `${job.output_width}×${job.output_height}`
    : job.width && job.height
      ? `${job.width}×${job.height}`
      : null;

  return (
    <div
      className="modal-bg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Before and after comparison"
    >
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
          <button type="button" className="btn btn-ghost btn-sm modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="muted" style={{ fontSize: ".86rem", marginBottom: 14 }}>
          Drag the slider to compare the same frame before and after cleaning.
        </p>
        {error && (
          <p style={{ color: "var(--danger)", fontSize: ".88rem", marginBottom: 12 }}>{error}</p>
        )}

        <CompareSlider
          aspectRatio={`${w} / ${h}`}
          loading={!ready && !error}
          disabled={!ready}
          labels={{ before: "BEFORE", after: "AFTER" }}
          before={
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="compare-media"
              src={`/v1/jobs/${job.id}/thumb/before`}
              alt="Original frame with watermark"
              onLoad={() => setLoaded((n) => n + 1)}
              onError={() => {
                setError("Could not load before preview");
                setLoaded((n) => n + 1);
              }}
              style={{ opacity: ready ? 1 : 0 }}
            />
          }
          after={
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="compare-media"
              src={`/v1/jobs/${job.id}/thumb/after`}
              alt="Cleaned frame without watermark"
              onLoad={() => setLoaded((n) => n + 1)}
              onError={() => {
                setError("Could not load after preview");
                setLoaded((n) => n + 1);
              }}
              style={{ opacity: ready ? 1 : 0 }}
            />
          }
        />

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {job.download_url && (
            <a className="btn btn-primary" href={job.download_url} style={{ flex: 1 }}>
              Download clean video
            </a>
          )}
          <button className="btn btn-ghost" style={{ flex: job.download_url ? 0 : 1 }} onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
