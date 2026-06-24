"use client";

import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="lp-announce">
      <div className="container lp-announce-inner">
        <span className="lp-announce-badge">New</span>
        <span>3 free videos on signup — paste or drop your clip right on this page</span>
        <Link href="/register" className="lp-announce-link">Start free →</Link>
      </div>
    </div>
  );
}
