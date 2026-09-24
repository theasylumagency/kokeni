import { notFound, permanentRedirect } from "next/navigation";
import { findPublicProduct } from "@/lib/catalog/productPage";
import { productPath, safeDecode } from "@/lib/catalog/urls";

export const dynamic = "force-dynamic";

/** Oldest URL shape: /catalog/{group}/{category}/{product-slug} → canonical product URL. */
export default async function LegacyProductPage({ params }: { params: Promise<{ lang: string; legacyProductSlug: string }> }) {
  const { lang, legacyProductSlug } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const match = await findPublicProduct(safeDecode(legacyProductSlug));
  if (!match) notFound();
  permanentRedirect(productPath(lang, match.category, match.product));
}
