import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/Toast";
import { ShortcutHelp } from "@/components/ShortcutHelp";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e13",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gemini Video Watermark Remove | GenClear — Free & Pixel-Perfect",
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "gemini video watermark remove",
    "gemini video watermark remove free",
    "remove gemini video watermark",
    "gemini watermark remover",
    "gemini diamond watermark",
    "Veo watermark remover",
    "remove AI video watermark",
    "watermark removal",
    "clean AI video",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/brand/logo.png", type: "image/png" }],
    apple: "/brand/logo.png",
  },
  openGraph: {
    title: "Gemini Video Watermark Remove — GenClear",
    description: "Remove Gemini video watermarks from every frame. Auto-detect, reverse alpha blend, download clean MP4. Start free.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini Video Watermark Remove — GenClear",
    description: "Remove Gemini video watermarks from every frame. Auto-detect, reverse alpha blend, download clean MP4. Start free.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ToastProvider>
          {children}
          <ShortcutHelp />
        </ToastProvider>
      </body>
    </html>
  );
}
