import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// Branded 1200×630 social card, generated at request time. Without this, links
// shared to social/chat render a blank preview.
// Note: Satori (the renderer) requires `display: flex` on any element with more
// than one child, and only ships Latin glyphs — so we avoid symbol characters
// that would trigger a network font fetch.
export const alt = "GenClear — remove Veo & Gemini watermarks, pixel-perfect.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(1200px 700px at 85% -10%, rgba(20,184,166,0.35), transparent 55%), linear-gradient(135deg, #0a0e13 0%, #0e1722 100%)",
          color: "#f0f4f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              display: "flex",
              background: "linear-gradient(135deg, #14b8a6, #2dd4bf)",
            }}
          />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Remove Veo &amp; Gemini
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#2dd4bf",
            }}
          >
            watermarks.
          </div>
          <div style={{ display: "flex", fontSize: 33, color: "#8b9cb8", maxWidth: 900 }}>
            Pixel-exact reverse alpha blending — not generative fill. No quality loss.
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, fontSize: 26, color: "#5b6b82" }}>
          <div style={{ display: "flex", color: "#34d399" }}>Free trial</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>Before / after compare</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>API access</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
