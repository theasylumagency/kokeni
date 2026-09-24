import type { Locale } from "@/lib/catalog/types";
import { BRAND, SITE_URL, absoluteUrl } from "@/lib/site";
import { CONTACT } from "@/lib/contact";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const inLanguage = (locale: Locale) => (locale === "en" ? "en" : "ka");

/** Site-wide brand entity: LocalBusiness (with Organization properties) + WebSite. */
export function organizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": ORG_ID,
        name: BRAND.name,
        legalName: BRAND.legalName[locale],
        alternateName: [BRAND.legalName.ka, BRAND.legalName.en, "Kokeni", "კოკენი"],
        url: `${SITE_URL}/${locale}`,
        logo: absoluteUrl(BRAND.logo),
        image: absoluteUrl(BRAND.ogImage),
        foundingDate: String(BRAND.foundingYear),
        email: BRAND.email,
        telephone: BRAND.telephone[0],
        address: {
          "@type": "PostalAddress",
          streetAddress: BRAND.address.streetAddress[locale],
          addressLocality: BRAND.address.addressLocality[locale],
          postalCode: BRAND.address.postalCode,
          addressCountry: BRAND.address.addressCountry,
        },
        areaServed: { "@type": "Country", name: "Georgia" },
        contactPoint: [{ "@type": "ContactPoint", contactType: "sales", telephone: CONTACT.phone, email: CONTACT.email, availableLanguage: ["ka", "en"] }],
        ...(BRAND.sameAs.length ? { sameAs: BRAND.sameAs } : {}),
      },
      { "@type": "WebSite", "@id": SITE_ID, url: SITE_URL, name: BRAND.name, inLanguage: inLanguage(locale), publisher: { "@id": ORG_ID } },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export function itemListJsonLd(name: string, items: { name: string; path: string; image?: string }[]) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(item.path), name: item.name, ...(item.image ? { image: absoluteUrl(item.image) } : {}) })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

/** A made-to-order example. Offers only when a real price is published (fixed, or "from" on the item type). */
export function productJsonLd(opts: {
  locale: Locale; name: string; description: string; path: string; sku: string; images: string[]; category: string;
  additionalProperty: { name: string; value: string }[]; price?: { amount: number; kind: "fixed" | "from" };
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: opts.name,
    description: opts.description,
    sku: opts.sku,
    url,
    category: opts.category,
    inLanguage: inLanguage(opts.locale),
    ...(opts.images.length ? { image: opts.images.map(absoluteUrl) } : {}),
    brand: { "@type": "Brand", name: BRAND.name },
    manufacturer: { "@id": ORG_ID },
    ...(opts.additionalProperty.length ? { additionalProperty: opts.additionalProperty.map(prop => ({ "@type": "PropertyValue", ...prop })) } : {}),
    ...(opts.price ? {
      offers: opts.price.kind === "fixed"
        ? { "@type": "Offer", price: opts.price.amount, priceCurrency: "GEL", url, seller: { "@id": ORG_ID } }
        : { "@type": "AggregateOffer", lowPrice: opts.price.amount, priceCurrency: "GEL", url, seller: { "@id": ORG_ID } },
    } : {}),
  };
}
