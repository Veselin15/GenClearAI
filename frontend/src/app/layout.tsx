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
    default: "GenClear — Remove Veo & Gemini Watermarks | Pixel-Perfect AI Video",
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Veo watermark remover",
    "Gemini watermark remover",
    "remove AI video watermark",
    "watermark removal",
    "clean AI video",
    "reverse alpha blending",
  ],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "GenClear — Professional Veo & Gemini watermark removal",
    description: "Pixel-perfect watermark removal for creators, agencies, and filmmakers. Upload, compare, download. Start free.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "GenClear — Professional Veo & Gemini watermark removal",
    description: "Pixel-perfect watermark removal for creators, agencies, and filmmakers. Start free.",
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
