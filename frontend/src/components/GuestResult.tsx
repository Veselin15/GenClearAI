"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { CompareSlider } from "./CompareSlider";
import Link from "next/link";

export function GuestResult({
  job,
  onRegister,
}: {
  job: Job;
  onRegister: () => void;
}) {
  const [loaded, setLoaded] = useState(0);
  const [imgErrors, setImgErrors] = useState(0);
  const ready = loaded >= 2;
  const w = job.output_width || job.width || 16;
  const h = job.output_height || job.height || 9;

  return (
    <div className="guest-result card">
      <div className="guest-result-head">
        <h3>Your clean clip is ready</h3>
        <p className="muted" style={{ fontSize: ".9rem", margin: 0 }}>
          Drag the slider to compare — this is your <strong>one free</strong> anonymous download.
        </p>
      </div>

      {imgErrors >= 2 ? (
        <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
          Preview unavailable — your download is still ready below.
        </p>
      ) : (
        <CompareSlider
          aspectRatio={`${w} / ${h}`}
          loading={!ready}
          disabled={!ready}
          labels={{ before: "BEFORE", after: "AFTER" }}
          before={
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="compare-media"
              src={`/v1/guest/jobs/${job.id}/thumb/before`}
              alt="Original frame with watermark"
              onLoad={() => setLoaded((n) => n + 1)}
              onError={() => { setLoaded((n) => n + 1); setImgErrors((n) => n + 1); }}
              style={{ opacity: ready ? 1 : 0 }}
            />
          }
          after={
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="compare-media"
              src={`/v1/guest/jobs/${job.id}/thumb/after`}
              alt="Cleaned frame without watermark"
              onLoad={() => setLoaded((n) => n + 1)}
              onError={() => { setLoaded((n) => n + 1); setImgErrors((n) => n + 1); }}
              style={{ opacity: ready ? 1 : 0 }}
            />
          }
        />
      )}

      <div className="guest-result-actions">
        {job.download_url && (
          <a className="btn btn-primary btn-lg" href={job.download_url}>
            Download clean MP4
          </a>
        )}
        <button type="button" className="btn btn-ghost btn-lg" onClick={onRegister}>
          Create free account for 3/month →
        </button>
      </div>

      <p className="muted guest-result-foot">
        Need more clips? <Link href="/register" className="link-accent">Register free</Link> for 3 monthly credits, workspace, and 1080p processing.
      </p>
    </div>
  );
}
