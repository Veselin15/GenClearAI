"use client";

import { useEffect, useState } from "react";
import { fmtDuration, getActivity } from "@/lib/api";
import type { ActivityItem } from "@/lib/types";

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function describe(item: ActivityItem) {
  if (item.from_cache) return "⚡ instant replay";
  const parts = [];
  if (item.resolution) parts.push(item.resolution);
  if (item.watermark_type) parts.push(item.watermark_type);
  if (item.processing_sec) parts.push(fmtDuration(item.processing_sec) ?? "");
  return parts.filter(Boolean).join(" · ") || "video cleaned";
}

export function ActivityTicker() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const load = () => getActivity().then(setItems).catch(() => {});
    load();
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, []);

  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div className="activity-ticker-wrap">
      <div className="activity-ticker-label">
        <span className="live-dot" /> Live activity
      </div>
      <div className="activity-ticker-track">
        <div className="activity-ticker-inner">
          {doubled.map((item, i) => (
            <span key={`${item.at}-${i}`} className="activity-chip">
              <b>A creator</b> cleaned {describe(item)} · {timeAgo(item.at)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
