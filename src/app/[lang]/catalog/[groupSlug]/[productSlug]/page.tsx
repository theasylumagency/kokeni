import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogNavigation from "@/components/catalog/CatalogNavigation";
import ProductGallery from "@/components/catalog/ProductGallery";
import { findPublicProduct } from "@/lib/catalog/productPage";
import { getLocalizedValue } from "@/lib/catalog/data";
import { productPath } from "@/lib/catalog/urls";
import { getDictionary } from "@/utils/getDictionary";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; groupSlug: string; productSlug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, productSlug } = await params;
  const match = await findPublicProduct(productSlug);
  if (!match || !["ka", "en"].includes(lang)) return { title: "Product not found" };
  const locale = lang === "en" ? "en" : "ka";
  return {
    title: `${getLocalizedValue(match.product.name, locale)} | KOKENI`,
    description: getLocalizedValue(match.product.shortDescription, locale),
    alternates: {
      canonical: productPath(lang, match.group.slug, match.product),
      languages: { ka: productPath("ka", match.group.slug, match.product), en: productPath("en", match.group.slug, match.product) },
    },
  };
}
export default async function ProductPage({ params }: Props) {
  const { lang, groupSlug, productSlug } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const [match, dict] = await Promise.all([findPublicProduct(productSlug), getDictionary(lang)]);
  if (!match) notFound();
  const { product, category, group, groups } = match;
  const canonical = productPath(lang, group.slug, product);
  if (`/${lang}/catalog/${groupSlug}/${productSlug}` !== canonical) permanentRedirect(canonical);
  const name = getLocalizedValue(product.name, lang);
  const description = getLocalizedValue(product.longDescription, lang);
  return <div className="min-h-screen bg-[#fcfcfc] pt-14 text-[#1a1b1c]">
    <CatalogNavigation groups={groups} lang={lang} dict={dict} currentGroupSlug={group.slug} theme="light" />
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
      <nav aria-label={lang === "en" ? "Breadcrumb" : "ნავიგაცია"} className="mb-8 flex flex-wrap gap-2 text-xs text-gray-500"><Link href={`/${lang}/catalog`}>{lang === "en" ? "Catalog" : "კატალოგი"}</Link><span>/</span><Link href={`/${lang}/catalog/${group.slug}`}>{getLocalizedValue(group.name, lang)}</Link><span>/</span><Link href={`/${lang}/catalog/${group.slug}#${category.slug}`}>{getLocalizedValue(category.name, lang)}</Link></nav>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
        <ProductGallery images={product.images} name={name} lang={lang} />
        <div className="lg:sticky lg:top-28"><p className="mb-4 font-mono text-xs tracking-widest text-gray-500">{product.code?.toUpperCase()}</p><h1 className="text-3xl font-bold tracking-tight md:text-5xl">{name}</h1><p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-gray-600">{getLocalizedValue(product.shortDescription, lang)}</p>
          {description && <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-600">{description}</p>}
          <p className="mt-8 border-t border-black/10 pt-6 font-medium">{product.price.mode === "fixed" ? `${product.price.amount} GEL` : dict.catalog.price_contact}</p>
          <a className="mt-6 inline-flex rounded-sm bg-[#1a1b1c] px-6 py-4 text-sm text-white hover:bg-gray-700" href={`mailto:manufacturing@kokeni.ge?subject=${encodeURIComponent(`${product.code?.toUpperCase()} — ${name}`)}`}>{lang === "en" ? "Ask about this product" : "პროდუქტის შესახებ დაკავშირება"}</a>
        </div>
      </div>
    </main>
  </div>;
}
