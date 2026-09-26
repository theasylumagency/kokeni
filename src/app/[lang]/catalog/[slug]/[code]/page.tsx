import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AttributeList from "@/components/catalog/AttributeList";
import ContactActions from "@/components/catalog/ContactActions";
import OrderTermsList from "@/components/catalog/OrderTermsList";
import { leadTimeLabel, localized, minQuantityLabel, priceFromLabel, typePath } from "@/lib/catalog/typeCatalog";
import { clip, pageMetadata } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import ProductGallery from "@/components/catalog/ProductGallery";
import { findPublicProduct } from "@/lib/catalog/productPage";
import { getLocalizedValue } from "@/lib/catalog/data";
import { familyPath, productPath, safeDecode } from "@/lib/catalog/urls";
import { getDictionary } from "@/utils/getDictionary";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; slug: string; code: string }> };
function productDescription(match: NonNullable<Awaited<ReturnType<typeof findPublicProduct>>>, locale: "ka" | "en"): string {
  const { product, category } = match;
  const name = getLocalizedValue(product.name, locale);
  const own = [getLocalizedValue(product.shortDescription, locale), getLocalizedValue(product.longDescription, locale)].find(text => text && text.trim().toLowerCase() !== name.trim().toLowerCase());
  if (own) return own;
  const typeName = getLocalizedValue(category.name, locale);
  const code = (product.code || product.slug).toUpperCase();
  const specs = (product.specifications || []).slice(0, 3).map(attribute => `${localized(attribute.label, locale)}: ${localized(attribute.value, locale)}`).join(", ");
  const terms = [minQuantityLabel(category.orderTerms, locale), leadTimeLabel(category.orderTerms, locale)].filter(Boolean).join(", ");
  return locale === "en"
    ? `${typeName}, completed example ${code}${specs ? ` — ${specs}` : ""}. Order a similar piece made to your specification${terms ? ` (${terms})` : ""} from KOKENI, Tbilisi.`
    : `${typeName}, შესრულებული ნამუშევარი ${code}${specs ? ` — ${specs}` : ""}. შეუკვეთეთ მსგავსი თქვენი მოთხოვნით${terms ? ` (${terms})` : ""} — KOKENI, თბილისი.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, code } = await params;
  const match = await findPublicProduct(safeDecode(code));
  if (!match || (lang !== "ka" && lang !== "en")) return { title: "Product not found" };
  const name = getLocalizedValue(match.product.name, lang);
  return pageMetadata({
    locale: lang,
    title: `${name} · ${(match.product.code || match.product.slug).toUpperCase()} | KOKENI`,
    description: clip(productDescription(match, lang)),
    pathFor: locale => productPath(locale, match.category, match.product),
    image: match.product.images.find(image => image.role === "main")?.src || match.product.images[0]?.src,
  });
}

/** Canonical product page: /{lang}/catalog/{type}/{code}. Old sector-based URLs (/catalog/academic/{code}) redirect here. */
export default async function ProductPage({ params }: Props) {
  const { lang, slug, code } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const [match, dict] = await Promise.all([findPublicProduct(safeDecode(code)), getDictionary(lang)]);
  if (!match) notFound();
  const { product, category, group, family } = match;
  if (safeDecode(slug) !== category.slug || safeDecode(code) !== (product.code || product.slug)) permanentRedirect(productPath(lang, category, product));
  const name = getLocalizedValue(product.name, lang);
  const typeName = getLocalizedValue(category.name, lang);
  const description = getLocalizedValue(product.longDescription, lang);
  const productCode = (product.code || product.slug).toUpperCase();
  const price = product.price.mode === "fixed" ? `${product.price.amount} ₾` : priceFromLabel(category.orderTerms, lang) || dict.catalog.price_contact;
  const termsWithoutPrice = category.orderTerms ? { ...category.orderTerms, priceFrom: undefined } : undefined;
  const images = [...product.images].sort((a, b) => a.order - b.order).map(image => image.src);
  const familyCrumb = family?.landing ? { name: localized(family.config.title, lang), path: familyPath(lang, family.config.id) } : undefined;
  return <div className="min-h-screen bg-[#fcfcfc] pt-14 text-[#1a1b1c]">
    <JsonLd data={breadcrumbJsonLd([{ name: lang === "en" ? "Catalog" : "კატალოგი", path: `/${lang}/catalog` }, ...(familyCrumb ? [familyCrumb] : []), { name: typeName, path: typePath(lang, category) }, { name: productCode, path: productPath(lang, category, product) }])} />
    <JsonLd data={productJsonLd({
      locale: lang, name, description: productDescription(match, lang), path: productPath(lang, category, product), sku: productCode, images, category: typeName,
      additionalProperty: (product.specifications || []).map(attribute => ({ name: localized(attribute.label, lang), value: localized(attribute.value, lang) })),
      price: product.price.mode === "fixed" ? { amount: product.price.amount, kind: "fixed" } : category.orderTerms?.priceFrom ? { amount: category.orderTerms.priceFrom, kind: "from" } : undefined,
    })} />
    <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20" data-ga-page="catalog_product" data-ga-view-id={product.code || product.slug} data-ga-view-name={name} data-ga-view-category={category.slug} data-ga-view-category2={group.slug}>
      <nav aria-label={lang === "en" ? "Breadcrumb" : "ნავიგაცია"} className="mb-8 flex flex-wrap gap-2 text-xs text-gray-500"><Link href={`/${lang}/catalog`}>{lang === "en" ? "Catalog" : "კატალოგი"}</Link><span>/</span>{familyCrumb && <><Link href={familyCrumb.path}>{familyCrumb.name}</Link><span>/</span></>}<Link href={typePath(lang, category)}>{typeName}</Link><span>/</span><span aria-current="page">{productCode}</span></nav>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
        <ProductGallery images={product.images} name={name} lang={lang} />
        <div className="lg:sticky lg:top-28"><p className="mb-4 font-mono text-xs tracking-widest text-gray-500">{productCode}</p><h1 className="text-3xl font-bold tracking-tight md:text-5xl">{name}</h1><p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-gray-600">{getLocalizedValue(product.shortDescription, lang)}</p>
          {description && <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-600">{description}</p>}
          {!!product.specifications?.length && <section className="mt-8"><h2 className="mb-4 text-lg">{lang === "en" ? "This example’s specifications" : "ამ ნამუშევრის მახასიათებლები"}</h2><AttributeList attributes={product.specifications} locale={lang} /></section>}
          <p className="mt-8 border-t border-black/10 pt-6 font-medium">{price}</p>
          <OrderTermsList terms={termsWithoutPrice} locale={lang} />
          <ContactActions locale={lang} subject={`${productCode} — ${name}`} context={product.code || product.slug} />
          <Link className="mt-6 block text-sm underline underline-offset-4" href={typePath(lang, category)}>{lang === "en" ? "See other examples and options" : "სხვა ნამუშევრები და შესაძლებლობები"} →</Link>
        </div>
      </div>
    </main>
  </div>;
}
