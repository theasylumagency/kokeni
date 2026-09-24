import type { Metadata } from "next";
import type { Locale } from "@/lib/catalog/types";
import { CONTACT } from "@/lib/contact";

/** Public origin. Override with NEXT_PUBLIC_SITE_URL (e.g. on a staging host). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kokeni.ge").replace(/\/+$/, "");

export const absoluteUrl = (path: string): string => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

/**
 * Brand entity used by JSON-LD and metadata. Keep facts here consistent with the page copy.
 * `sameAs`: add official profile URLs (Facebook, Instagram, Google Business Profile, LinkedIn) when they exist.
 */
export const BRAND = {
  name: "KOKENI",
  legalName: { ka: "შპს კოკენი", en: "Kokeni LLC" },
  foundingYear: 1989,
  logo: "/logo/kokeni_logo.svg",
  ogImage: "/og/kokeni-og.jpg",
  address: {
    streetAddress: { ka: "შარტავას ქ. 35/37", en: "35/37 Shartava St." },
    addressLocality: { ka: "თბილისი", en: "Tbilisi" },
    postalCode: "0160",
    addressCountry: "GE",
  },
  telephone: ["+995322386589", CONTACT.phone],
  email: CONTACT.email,
  sameAs: [] as string[],
} as const;

export const ogLocale = (locale: Locale): string => (locale === "en" ? "en_US" : "ka_GE");

/** Canonical + hreflang (ka, en, x-default → ka) for a page that exists in both languages. */
export function localeAlternates(pathFor: (locale: Locale) => string, locale: Locale): NonNullable<Metadata["alternates"]> {
  return {
    canonical: pathFor(locale),
    languages: { ka: pathFor("ka"), en: pathFor("en"), "x-default": pathFor("ka") },
  };
}

/** Trim to a meta-description-friendly length on a word boundary. */
export function clip(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,.;:—-]+$/, "")}…`;
}

/** Shared metadata builder: title, description, canonical/hreflang, Open Graph and Twitter card. */
export function pageMetadata(opts: {
  locale: Locale;
  title: string;
  description: string;
  pathFor: (locale: Locale) => string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const { locale, title, description, pathFor } = opts;
  const image = absoluteUrl(opts.image || BRAND.ogImage);
  return {
    title,
    description,
    alternates: localeAlternates(pathFor, locale),
    openGraph: {
      type: opts.type || "website",
      siteName: BRAND.name,
      locale: ogLocale(locale),
      alternateLocale: ogLocale(locale === "en" ? "ka" : "en"),
      url: pathFor(locale),
      title,
      description,
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
