"use client";

import { useEffect, useState } from "react";
import { fmtEta, getStats } from "@/lib/api";
import type { Stats } from "@/lib/types";

export function LiveQueueBanner() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    const id = setInterval(() => getStats().then(setStats).catch(() => {}), 30000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return null;

  const avg = stats.avg_processing_sec
    ? fmtEta(Math.round(stats.avg_processing_sec))
    : "~2 min";

  return (
    <div className="queue-banner">
      <span className="live-dot" />
      <span>
        {stats.queue_depth > 0
          ? `${stats.queue_depth} clip${stats.queue_depth === 1 ? "" : "s"} in queue · avg ${avg}`
          : `Queue clear · typical wait ${avg}`}
        {stats.cache_hits > 0 && ` · ${stats.cache_hits.toLocaleString()} instant replays`}
      </span>
    </div>
  );
}
