"use client";

import { useEffect, useState } from "react";
import { fmtDuration, getStats } from "@/lib/api";
import type { Stats } from "@/lib/types";

export function StatsStrip() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  const avg = stats.avg_processing_sec ? fmtDuration(stats.avg_processing_sec) : "~2m";

  return (
    <div className="stats-strip">
      <div className="stat">
        <b>{stats.videos_cleaned.toLocaleString()}</b>
        <span>videos cleaned</span>
      </div>
      <div className="stat">
        <b>{avg}</b>
        <span>avg processing</span>
      </div>
      <div className="stat">
        <b>{stats.cache_hits.toLocaleString()}</b>
        <span>instant replays</span>
      </div>
    </div>
  );
}
