import { notFound, permanentRedirect } from "next/navigation";
import { findPublicProduct } from "@/lib/catalog/productPage";
import { productPath } from "@/lib/catalog/urls";

export const dynamic = "force-dynamic";
export default async function LegacyProductPage({ params }: { params: Promise<{ lang: string; legacyProductSlug: string }> }) {
  const { lang, legacyProductSlug } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const match = await findPublicProduct(legacyProductSlug);
  if (!match) notFound();
  permanentRedirect(productPath(lang, match.group.slug, match.product));
}
