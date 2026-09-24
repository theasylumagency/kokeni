import type { Metadata } from "next";
import "../globals.css";
import { getDictionary } from "@/utils/getDictionary";
import Navigation from "@/components/layout/Navigation";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import AnalyticsEvents from "@/components/analytics/AnalyticsEvents";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/seo/jsonld";
import { BRAND, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND.name,
  title: { default: "KOKENI", template: "%s" },
  manifest: "/site.webmanifest",
  formatDetection: { telephone: false },
};

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ka' }]
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <html lang={lang}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased relative min-h-screen w-full font-display selection:bg-primary selection:text-white"
      >
        <JsonLd data={organizationJsonLd(lang === "en" ? "en" : "ka")} />
        <Navigation dict={dict} lang={lang} />
        {children}
        <AnalyticsEvents />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
