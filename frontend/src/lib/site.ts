// Single source of truth for the public site identity. Used by page metadata,
// the sitemap, robots.txt, structured data, and the generated social card.
// Override the origin per-environment with NEXT_PUBLIC_SITE_URL (no trailing slash).

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://genclear.app"
).replace(/\/$/, "");

export const SITE_NAME = "GenClear";

export const SITE_TAGLINE = "Remove Veo & Gemini watermarks — pixel-perfect AI video";

export const SITE_DESCRIPTION =
  "Ship clean AI video in minutes. GenClear removes Veo and Gemini watermarks with exact reverse alpha blending — no generative fill, no quality loss. Free trial, API access, priority queue.";

export function abs(path = "/"): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
