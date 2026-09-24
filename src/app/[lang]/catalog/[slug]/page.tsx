import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { illustrationFor, localized, publicTypes, typeCover, typeExamples, typeFaq, typeMetaDescription, typePath } from "@/lib/catalog/typeCatalog";
import { clip, pageMetadata } from "@/lib/site";
import { CONTACT } from "@/lib/contact";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { productPath, sectorPath, safeDecode } from "@/lib/catalog/urls";
import TypeDrawing from "@/components/catalog/TypeDrawing";
import TypeCard from "@/components/catalog/TypeCard";
import TypeExamples from "@/components/catalog/TypeExamples";
import AttributeList from "@/components/catalog/AttributeList";
import ContactActions from "@/components/catalog/ContactActions";
import OrderTermsList from "@/components/catalog/OrderTermsList";
import styles from "@/components/catalog/TypeCatalog.module.css";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; slug: string }> };

/** /catalog/{slug} is an item type. An old sector URL (/catalog/academic) is redirected to /catalog/sector/academic. */
const resolve = cache(async (rawSlug: string) => {
  const slug = safeDecode(rawSlug);
  const catalog = await getCatalogSnapshot();
  const categories = publicTypes(catalog.groups, catalog.categories);
  const category = categories.find(item => item.slug === slug) || categories.find(item => item.legacySlugs?.includes(slug));
  if (category) return { kind: "type" as const, slug, catalog, categories, category };
  const group = catalog.groups.find(item => item.isActive && (item.slug === slug || item.legacySlugs?.includes(slug)));
  return group ? { kind: "sector" as const, group } : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const match = await resolve(slug);
  if (match?.kind !== "type" || (lang !== "en" && lang !== "ka")) return {};
  const { category, catalog } = match;
  const name = localized(category.name, lang);
  const cover = typeCover(category, catalog.products);
  return pageMetadata({
    locale: lang,
    title: lang === "en" ? `${name} — Made to Order in Tbilisi | KOKENI` : `${name} — დამზადება შეკვეთით | KOKENI`,
    description: clip(typeMetaDescription(category, lang)),
    pathFor: locale => typePath(locale, category),
    image: cover?.images[0]?.src,
  });
}

export default async function ItemTypePage({ params }: Props) {
  const { lang, slug } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const match = await resolve(slug);
  if (!match) notFound();
  if (match.kind === "sector") permanentRedirect(sectorPath(lang, match.group));
  const { catalog, categories, category } = match;
  if (category.slug !== match.slug) permanentRedirect(typePath(lang, category));
  const name = localized(category.name, lang);
  const description = localized(category.description, lang);
  const examples = typeExamples(category, catalog.products);
  const cover = typeCover(category, catalog.products);
  const group = catalog.groups.find(group => group.id === category.groupId)!;
  const faq = typeFaq(category, lang, { phone: CONTACT.phoneDisplay, email: CONTACT.email });
  const catalogLabel = lang === "en" ? "Catalog" : "კატალოგი";
  const related = (category.relatedCategoryIds || []).map(id => categories.find(item => item.id === id && item.id !== category.id)).filter(item => item !== undefined);
  return <div className={styles.page}>
    <JsonLd data={breadcrumbJsonLd([{ name: catalogLabel, path: `/${lang}/catalog` }, { name, path: typePath(lang, category) }])} />
    <JsonLd data={itemListJsonLd(name, examples.map(product => ({ name: localized(product.name, lang), path: productPath(lang, category, product), image: product.images[0]?.src })))} />
    <JsonLd data={faqJsonLd(faq)} />
    <main className={styles.wrap} data-ga-page="catalog_type" data-ga-list={category.slug}>
    <nav className={styles.breadcrumb} aria-label={lang === "en" ? "Breadcrumb" : "ნავიგაცია"}><Link href={`/${lang}/catalog`}>{lang === "en" ? "All item types" : "ყველა ნივთის ტიპი"}</Link><span>/</span><span>{name}</span></nav>
    <header className={styles.typeHero}>
      <div><span className={styles.eyebrow}>KOKENI / {lang === "en" ? "MADE TO ORDER" : "მზადდება შეკვეთით"}</span><h1>{name}</h1><p className={styles.body}>{description || (lang === "en" ? "Explore completed examples as a starting point. We will discuss the format, materials and details for your order." : "ნახეთ შესრულებული ნამუშევრები და შეარჩიეთ საწყისი მაგალითი. თქვენი შეკვეთის ფორმატს, მასალასა და დეტალებს ერთად შევათანხმებთ.")}</p>
        <OrderTermsList terms={category.orderTerms} locale={lang} />
        <ContactActions locale={lang} subject={name} context={category.slug} />
        <a className={styles.textLink} style={{ marginLeft: 0 }} href="#examples">{lang === "en" ? "View examples" : "ნამუშევრების ნახვა"} ↓</a>
        {related.length > 0 && <a className={styles.textLink} style={{ display: "block", marginLeft: 0 }} href="#related">{lang === "en" ? "Items to order together" : "რა შეიძლება შეუკვეთოთ ამ ნივთთან ერთად"} ↓</a>}
      </div>
      <div className={styles.heroVisual}>{cover ? <Image src={cover.images[0].src} alt={localized(cover.name, lang)} fill unoptimized sizes="(max-width:600px) 100vw, 50vw" loading="eager" /> : <TypeDrawing kind={illustrationFor(category)} />}<span className={styles.heroCaption}>{cover ? (lang === "en" ? "COMPLETED EXAMPLE" : "შესრულებული ნამუშევარი") : (lang === "en" ? "SCHEMATIC ILLUSTRATION" : "სქემატური გამოსახულება")}</span></div>
    </header>
    {!!category.customization?.length && <section className={styles.section}><div className={styles.sectionHead}><h2>{lang === "en" ? "Make it your own" : "რა შეიძლება შეიცვალოს"}</h2></div><AttributeList attributes={category.customization} locale={lang} /><p className={styles.body} style={{ marginTop: 16, fontSize: 12 }}>{lang === "en" ? "We confirm compatible materials, details and quantities when discussing your order." : "მასალების, დეტალებისა და რაოდენობის შესაბამისობას შეკვეთის განხილვისას ვაზუსტებთ."}</p></section>}
    <section className={styles.section} id="examples"><div className={styles.sectionHead}><h2>{lang === "en" ? "Completed examples" : "შესრულებული ნამუშევრები"}</h2><p>{lang === "en" ? "Choose a starting point for your order" : "შეარჩიეთ საწყისი მაგალითი თქვენი შეკვეთისთვის"}</p></div><TypeExamples locale={lang} examples={examples.map(product => ({ id: product.id, name: localized(product.name, lang), code: product.code || product.slug, href: productPath(lang, category, product), image: product.images[0]?.src, specifications: product.specifications || [], typeSlug: category.slug, sectorSlug: group.slug }))} /></section>
    {related.length > 0 && <section className={styles.section} id="related"><div className={styles.sectionHead}><h2>{lang === "en" ? "To go with it" : "ამ ნივთთან ერთად"}</h2><p>{lang === "en" ? "Discuss a coordinated set" : "შევათანხმოთ ერთიანი ნაკრები"}</p></div><div className={styles.grid} style={{ paddingBottom: 0 }}>{related.map((item, index) => <TypeCard category={item} locale={lang} count={typeExamples(item, catalog.products).length} index={index} key={item.id} />)}</div></section>}
    <section className={styles.section} id="faq"><div className={styles.sectionHead}><h2>{lang === "en" ? "Frequently asked questions" : "ხშირი კითხვები"}</h2></div>
      <div className={styles.faq}>{faq.map(item => <div key={item.question} className={styles.faqItem}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div>
    </section>
    <section className={styles.contact}><div><h2>{lang === "en" ? "Let’s discuss your version" : "შევქმნათ თქვენი ვერსია"}</h2><p className={styles.body}>{lang === "en" ? "Tell us the quantity, preferred format and when you need it." : "მოგვწერეთ სასურველი რაოდენობა, ფორმატი და როდის გჭირდებათ დამზადება."}</p></div><ContactActions locale={lang} subject={name} context={category.slug} /></section>
    <footer className={styles.footer}><span>© {new Date().getFullYear()} KOKENI</span><Link href={`/${lang}/catalog`}>{lang === "en" ? "All item types" : "ყველა ნივთის ტიპი"} ↗</Link></footer>
  </main></div>;
}
