import Script from "next/script";

/** GA4 measurement ID for kokeni.ge */
export const GA_ID = "G-PC4M36K6YY";

const isProd = process.env.NODE_ENV === "production";
// Set NEXT_PUBLIC_GA_DEBUG=1 in .env.local to test from localhost in GA4 → Admin → DebugView.
const debug = process.env.NEXT_PUBLIC_GA_DEBUG === "1";

/**
 * Loads GA4 (gtag.js). Renders nothing in development, so local traffic is not counted.
 * Page views are sent on first load; client-side route changes are picked up by GA4
 * "Enhanced measurement → Page changes based on browser history events" (on by default).
 */
export default function GoogleAnalytics() {
  if (!isProd && !debug) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}'${debug ? ", { debug_mode: true }" : ""});
        `}
      </Script>
    </>
  );
}
