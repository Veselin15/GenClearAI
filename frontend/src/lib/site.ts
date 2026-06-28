// Single source of truth for the public site identity. Used by page metadata,
// the sitemap, robots.txt, structured data, and the generated social card.
// Override the origin per-environment with NEXT_PUBLIC_SITE_URL (no trailing slash).

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://genclear.net"
).replace(/\/$/, "");

export const SITE_NAME = "GenClear";

export const SITE_TAGLINE =
  "Remove Gemini video watermarks — pixel-perfect, every frame";

export const SITE_DESCRIPTION =
  "Gemini video watermark remove free — strip the diamond mark from every frame in minutes. No login, no credit card. Upload, compare, download clean MP4.";

export function abs(path = "/"): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
