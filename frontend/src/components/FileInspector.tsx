"use client";

import { useEffect, useState } from "react";
import { fmtDuration, fmtEta, getStats } from "@/lib/api";

export function FileInspector({ file }: { file: File }) {
  const [meta, setMeta] = useState<{
    duration: number;
    width: number;
    height: number;
  } | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [avgSec, setAvgSec] = useState(120);

  useEffect(() => {
    getStats().then((s) => {
      if (s.avg_processing_sec) setAvgSec(s.avg_processing_sec);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setThumb(url);

    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.src = url;
    vid.onloadedmetadata = () => {
      setMeta({
        duration: vid.duration,
        width: vid.videoWidth,
        height: vid.videoHeight,
      });
    };

    return () => {
      URL.revokeObjectURL(url);
      vid.src = "";
    };
  }, [file]);

  const estSec = meta
    ? Math.max(30, Math.min(600, Math.round(avgSec * (meta.duration / 45))))
    : null;

  return (
    <div className="file-inspector">
      {thumb && (
        <video className="file-inspector-vid" src={thumb} muted playsInline preload="metadata" />
      )}
      <div className="file-inspector-meta">
        {meta && (
          <>
            <span>{meta.width}×{meta.height}</span>
            <span>{fmtDuration(meta.duration)}</span>
            {estSec && <span className="pill pill-eta">Est. {fmtEta(estSec)}</span>}
          </>
        )}
        {!meta && <span className="muted">Reading video…</span>}
      </div>
    </div>
  );
}
