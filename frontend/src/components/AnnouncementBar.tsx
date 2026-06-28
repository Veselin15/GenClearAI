"use client";

import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="lp-announce">
      <div className="container lp-announce-inner">
        <span className="lp-announce-badge">New</span>
        <span>Remove Gemini video watermarks free — paste or drop your clip below</span>
        <Link href="/register" className="lp-announce-link">Start free →</Link>
      </div>
    </div>
  );
}
