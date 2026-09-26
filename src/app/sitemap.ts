import type { MetadataRoute } from "next";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { publicTypes, typeExamples, typePath } from "@/lib/catalog/typeCatalog";
import { familyPath, productPath, sectorPath } from "@/lib/catalog/urls";
import { composeCatalog, familyExamples } from "@/lib/catalog/composition";
import type { Locale } from "@/lib/catalog/types";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const LOCALES: Locale[] = ["ka", "en"];

/** One entry per URL and language, each carrying its ka/en/x-default alternates. */
function entries(pathFor: (locale: Locale) => string, lastModified: string | undefined, priority: number): MetadataRoute.Sitemap {
  const languages = { ka: absoluteUrl(pathFor("ka")), en: absoluteUrl(pathFor("en")), "x-default": absoluteUrl(pathFor("ka")) };
  return LOCALES.map(locale => ({ url: absoluteUrl(pathFor(locale)), lastModified, priority, alternates: { languages } }));
}

const latest = (dates: (string | undefined)[]): string | undefined => dates.filter(Boolean).sort().at(-1);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalogSnapshot();
  const types = publicTypes(catalog.groups, catalog.categories);
  const typeIds = new Set(types.map(type => type.id));
  const products = catalog.products.filter(product => product.isPublished && typeIds.has(product.categoryId));
  const catalogUpdated = latest([...types.map(type => type.updatedAt), ...products.map(product => product.updatedAt)]);
  const activeGroups = catalog.groups.filter(group => group.isActive && types.some(type => type.groupId === group.id));

  return [
    ...entries(locale => `/${locale}`, catalogUpdated, 1),
    ...entries(locale => `/${locale}/catalog`, catalogUpdated, 0.9),
    ...types.flatMap(type => entries(locale => typePath(locale, type), latest([type.updatedAt, ...typeExamples(type, products).map(product => product.updatedAt)]), 0.8)),
    ...products.flatMap(product => {
      const type = types.find(item => item.id === product.categoryId)!;
      return entries(locale => productPath(locale, type, product), product.updatedAt, 0.6);
    }),
    ...composeCatalog(types).families.filter(family => family.landing).flatMap(family =>
      entries(locale => familyPath(locale, family.config.id), latest([...family.members.map(member => member.updatedAt), ...familyExamples(family.members, products).map(product => product.updatedAt)]), 0.7)),
    ...activeGroups.flatMap(group => entries(locale => sectorPath(locale, group), group.updatedAt, 0.5)),
  ];
}
