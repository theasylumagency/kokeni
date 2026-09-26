import type { Category, Group, Product } from "./types";
import { LANDING_SLUGS } from "./composition";

const letters: Record<string, string> = Object.fromEntries(
  [..."აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ"].map((letter, index) => [letter,
    ["a", "b", "g", "d", "e", "v", "z", "t", "i", "k", "l", "m", "n", "o", "p", "zh", "r", "s", "t", "u", "f", "k", "gh", "q", "sh", "ch", "ts", "dz", "ts", "ch", "kh", "j", "h"][index]])
);

export function asciiSlug(value: string): string {
  return [...value.toLowerCase()].map((char) => letters[char] ?? char).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categoryCode(category: Category): string {
  const slug = asciiSlug(category.slug);
  const known: Record<string, string> = {
    "diploma-cover": "dc", notebook: "nb", diary: "dy", menu: "mc",
    receipt: "rp", "waiter-notebook": "wn", "document-and-card-holder": "dh",
    "ofitsialuri-dokumentis-qdebi": "oc",
  };
  return known[slug] || slug.split("-").filter(Boolean).map((part) => part[0]).join("").slice(0, 4) || "pr";
}

export function nextProductCode(category: Category, products: Product[], reserved: string[] = []): string {
  const prefix = `kkn-${categoryCode(category)}-`;
  const codes = [...products.flatMap((product) => [product.code || product.slug, ...(product.legacySlugs || [])]), ...reserved];
  const highest = codes.reduce((max, code) => code.startsWith(prefix) && /^\d+$/.test(code.slice(prefix.length))
    ? Math.max(max, Number(code.slice(prefix.length))) : max, 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

/** Top-level path segments under /catalog that item-type slugs must never take (routes and family landing pages). */
export const RESERVED_CATALOG_SLUGS = ["types", "sector", ...LANDING_SLUGS];

/** Canonical product URL: the item type is the primary axis (/catalog/{type}/{code}). */
export function productPath(lang: string, category: Pick<Category, "slug">, product: Pick<Product, "slug" | "code">): string {
  return `/${lang === "en" ? "en" : "ka"}/catalog/${encodeURIComponent(category.slug)}/${product.code || product.slug}`;
}

/** Sector (group) landing page — a secondary way into the catalog. */
export function sectorPath(lang: string, group: Pick<Group, "slug">): string {
  return `/${lang === "en" ? "en" : "ka"}/catalog/sector/${encodeURIComponent(group.slug)}`;
}

/** Route params may arrive encoded or already decoded depending on the runtime; never throw on stray "%". */
export function safeDecode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

/** Family landing page (e.g. /catalog/personal-documents) — a catalog entrance that is not an item type. */
export function familyPath(lang: string, familyId: string): string {
  return `/${lang === "en" ? "en" : "ka"}/catalog/${encodeURIComponent(familyId)}`;
}
