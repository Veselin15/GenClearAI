import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Branded 1200×630 social card with the GenClear logo lockup.
export const alt = "GenClear — Gemini video watermark remove, pixel-perfect.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoPath = join(process.cwd(), "public", "brand", "logo-text.png");
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

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
            "radial-gradient(1200px 700px at 85% -10%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(900px 600px at 10% 100%, rgba(20,184,166,0.2), transparent 50%), linear-gradient(135deg, #0a0e13 0%, #0e1722 100%)",
          color: "#f0f4f8",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="GenClear"
          height={88}
          style={{ objectFit: "contain", objectPosition: "left center" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Gemini video watermark
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
            remove — pixel-perfect.
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
