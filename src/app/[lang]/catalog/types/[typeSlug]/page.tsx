import { notFound, permanentRedirect } from "next/navigation";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { safeDecode } from "@/lib/catalog/urls";
import { publicTypes, typePath } from "@/lib/catalog/typeCatalog";

export const dynamic = "force-dynamic";

/** Old type URL (/catalog/types/{slug}) → /catalog/{slug}. */
export default async function LegacyTypePage({ params }: { params: Promise<{ lang: string; typeSlug: string }> }) {
  const { lang, typeSlug } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const catalog = await getCatalogSnapshot();
  const slug = safeDecode(typeSlug);
  const category = publicTypes(catalog.groups, catalog.categories).find(item => item.slug === slug || item.legacySlugs?.includes(slug));
  if (!category) notFound();
  permanentRedirect(typePath(lang, category));
}
