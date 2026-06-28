import type { NextConfig } from "next";

const API_URL = process.env.INTERNAL_API_URL ?? process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Proxy API traffic when Next.js is hit directly (e.g. localhost:3000 in dev).
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/v1/:path*", destination: `${API_URL}/v1/:path*` },
      { source: "/healthz", destination: `${API_URL}/healthz` },
    ];
  },
};

export default nextConfig;
