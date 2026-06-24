import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/Toast";
import { ShortcutHelp } from "@/components/ShortcutHelp";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e13",
};

export const metadata: Metadata = {
  title: "GenClear — Remove Veo & Gemini Watermarks | Pixel-Perfect AI Video",
  description: "Ship clean AI video in minutes. GenClear removes Veo and Gemini watermarks with exact reverse alpha blending — no generative fill, no quality loss. Free trial, API access, priority queue.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "GenClear — Professional Veo & Gemini watermark removal",
    description: "Pixel-perfect watermark removal for creators, agencies, and filmmakers. Upload, compare, download. Start free.",
    type: "website",
    siteName: "GenClear",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ToastProvider>
          {children}
          <ShortcutHelp />
        </ToastProvider>
      </body>
    </html>
  );
}
