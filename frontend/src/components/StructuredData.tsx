import { BRAND_ICON } from "@/components/BrandLogo";
import { CURRENCY, PRO_PRICE_MONTHLY } from "@/lib/pricing";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

interface Faq {
  q: string;
  a: string;
}

/**
 * JSON-LD structured data for the landing page. Makes GenClear eligible for
 * rich results in search — an app/product card, an FAQ expander, and sitelinks.
 * Server-rendered so crawlers see it without executing JS.
 */
export function StructuredData({ faq }: { faq: Faq[] }) {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}${BRAND_ICON}`,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: `${SITE_NAME} — Gemini Video Watermark Remove Tool`,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      featureList: [
        "Gemini video watermark remove — automatic diamond mark detection",
        "Veo wordmark removal",
        "Pixel-exact reverse alpha blending (no generative fill)",
        "Before/after compare slider",
        "Live progress with ETA",
        "API access for automation",
      ],
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: CURRENCY,
          description: "3 free videos on signup, +1 credit each day you return.",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: String(PRO_PRICE_MONTHLY),
          priceCurrency: CURRENCY,
          description: "Unlimited videos, priority queue, and API access.",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1200",
        bestRating: "5",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  const json = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      // Server-rendered static JSON — values are app-controlled, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
