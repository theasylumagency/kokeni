import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { illustrationFor, localized, publicTypes, typeCover, typeExamples, typeFaq, typeMetaDescription, typePath } from "@/lib/catalog/typeCatalog";
import { composeCatalog, familyOf, landingFamily } from "@/lib/catalog/composition";
import { clip, pageMetadata } from "@/lib/site";
import { CONTACT } from "@/lib/contact";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { familyPath, productPath, sectorPath, safeDecode } from "@/lib/catalog/urls";
import TypeDrawing from "@/components/catalog/TypeDrawing";
import TypeCard from "@/components/catalog/TypeCard";
import TypeExamples from "@/components/catalog/TypeExamples";
import AttributeList from "@/components/catalog/AttributeList";
import ContactActions from "@/components/catalog/ContactActions";
import OrderTermsList from "@/components/catalog/OrderTermsList";
import FamilyNav from "@/components/catalog/FamilyNav";
import FamilyLanding from "@/components/catalog/FamilyLanding";
import styles from "@/components/catalog/TypeCatalog.module.css";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; slug: string }> };

/**
 * /catalog/{slug} is an item type, or a family landing page (e.g. personal-documents).
 * An old sector URL (/catalog/academic) is redirected to /catalog/sector/academic.
 */
const resolve = cache(async (rawSlug: string) => {
  const slug = safeDecode(rawSlug);
  const catalog = await getCatalogSnapshot();
  const categories = publicTypes(catalog.groups, catalog.categories);
  const composition = composeCatalog(categories);
  const exact = categories.find(item => item.slug === slug);
  const landing = exact ? undefined : landingFamily(composition, slug);
  if (landing) return { kind: "family" as const, catalog, composition, family: landing };
  const category = exact || categories.find(item => item.legacySlugs?.includes(slug));
  if (category) return { kind: "type" as const, slug, catalog, categories, composition, category };
  const group = catalog.groups.find(item => item.isActive && (item.slug === slug || item.legacySlugs?.includes(slug)));
  return group ? { kind: "sector" as const, group } : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const match = await resolve(slug);
  if (lang !== "en" && lang !== "ka") return {};
  if (match?.kind === "family") {
    const { family, catalog } = match;
    const title = localized(family.config.title, lang);
    const names = family.members.map(member => localized(member.name, lang));
    const cover = family.members.map(member => typeCover(member, catalog.products)).find(Boolean);
    return pageMetadata({
      locale: lang,
      title: lang === "en" ? `${title}: ${names.slice(0, 3).join(", ")} | KOKENI` : `${title}: ${names.slice(0, 3).join(", ")} | KOKENI`,
      description: clip(localized(family.config.intro || family.config.lede, lang)),
      pathFor: locale => familyPath(locale, family.config.id),
      image: cover?.images[0]?.src,
    });
  }
  if (match?.kind !== "type") return {};
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
  if (match.kind === "family") return <FamilyLanding family={match.family} locale={lang} products={match.catalog.products} />;
  const { catalog, categories, composition, category } = match;
  if (category.slug !== match.slug) permanentRedirect(typePath(lang, category));
  const en = lang === "en";
  const name = localized(category.name, lang);
  const description = localized(category.description, lang);
  const examples = typeExamples(category, catalog.products);
  const cover = typeCover(category, catalog.products);
  const group = catalog.groups.find(group => group.id === category.groupId)!;
  const family = familyOf(composition, category.id);
  const faq = typeFaq(category, lang, { phone: CONTACT.phoneDisplay, email: CONTACT.email });
  const catalogLabel = en ? "Catalog" : "კატალოგი";
  const familyCrumb = family?.landing ? { name: localized(family.config.title, lang), path: familyPath(lang, family.config.id) } : undefined;
  const related = (category.relatedCategoryIds || []).map(id => categories.find(item => item.id === id && item.id !== category.id)).filter(item => item !== undefined);
  return <div className={styles.page}>
    <JsonLd data={breadcrumbJsonLd([{ name: catalogLabel, path: `/${lang}/catalog` }, ...(familyCrumb ? [familyCrumb] : []), { name, path: typePath(lang, category) }])} />
    <JsonLd data={itemListJsonLd(name, examples.map(product => ({ name: localized(product.name, lang), path: productPath(lang, category, product), image: product.images[0]?.src })))} />
    <JsonLd data={faqJsonLd(faq)} />
    <main className={styles.wrap} data-ga-page="catalog_type" data-ga-list={category.slug}>
    <nav className={styles.breadcrumb} aria-label={en ? "Breadcrumb" : "ნავიგაცია"}>
      <Link href={`/${lang}/catalog`}>{catalogLabel}</Link><span>/</span>
      {familyCrumb && <><Link href={familyCrumb.path}>{familyCrumb.name}</Link><span>/</span></>}
      <span aria-current="page">{name}</span>
    </nav>
    {family && <FamilyNav family={family} current={category} locale={lang} />}
    <header className={styles.typeHero}>
      <div><span className={styles.eyebrow}>KOKENI / {en ? "MADE TO ORDER" : "მზადდება შეკვეთით"}</span><h1>{name}</h1><p className={styles.body}>{description || (en ? "Explore completed examples as a starting point. We will discuss the format, materials and details for your order." : "ნახეთ შესრულებული ნამუშევრები და შეარჩიეთ საწყისი მაგალითი. თქვენი შეკვეთის ფორმატს, მასალასა და დეტალებს ერთად შევათანხმებთ.")}</p>
        <OrderTermsList terms={category.orderTerms} locale={lang} />
        <ContactActions locale={lang} subject={name} context={category.slug} />
        <a className={styles.textLink} style={{ marginLeft: 0 }} href="#examples">{en ? "View examples" : "ნამუშევრების ნახვა"} ↓</a>
        {related.length > 0 && <a className={styles.textLink} style={{ display: "block", marginLeft: 0 }} href="#related">{en ? "Items to order together" : "რა შეიძლება შეუკვეთოთ ამ ნივთთან ერთად"} ↓</a>}
      </div>
      <div className={`${styles.heroVisual} ${cover ? "" : styles.drawingOnly}`}>{cover ? <Image src={cover.images[0].src} alt={localized(cover.name, lang)} fill unoptimized sizes="(max-width:600px) 100vw, 50vw" loading="eager" /> : <span className={styles.familyDrawing}><TypeDrawing kind={illustrationFor(category)} /></span>}<span className={styles.heroCaption}>{cover ? (en ? "COMPLETED EXAMPLE" : "შესრულებული ნამუშევარი") : (en ? "SCHEMATIC DRAWING" : "სქემატური ნახაზი")}</span></div>
    </header>
    {!!category.customization?.length && <section className={styles.section}><div className={styles.sectionHead}><h2>{en ? "Make it your own" : "რა შეიძლება შეიცვალოს"}</h2></div><AttributeList attributes={category.customization} locale={lang} /><p className={styles.body} style={{ marginTop: 16, fontSize: 12 }}>{en ? "We confirm compatible materials, details and quantities when discussing your order." : "მასალების, დეტალებისა და რაოდენობის შესაბამისობას შეკვეთის განხილვისას ვაზუსტებთ."}</p></section>}
    <section className={styles.section} id="examples"><div className={styles.sectionHead}><h2>{en ? "Completed examples" : "შესრულებული ნამუშევრები"}</h2><p>{en ? "Choose a starting point for your order" : "შეარჩიეთ საწყისი მაგალითი თქვენი შეკვეთისთვის"}</p></div><TypeExamples locale={lang} examples={examples.map(product => ({ id: product.id, name: localized(product.name, lang), code: product.code || product.slug, href: productPath(lang, category, product), image: product.images[0]?.src, specifications: product.specifications || [], typeSlug: category.slug, sectorSlug: group.slug }))} /></section>
    {related.length > 0 && <section className={styles.section} id="related"><div className={styles.sectionHead}><h2>{en ? "To go with it" : "ამ ნივთთან ერთად"}</h2><p>{en ? "Discuss a coordinated set" : "შევათანხმოთ ერთიანი ნაკრები"}</p></div><div className={styles.typeGrid}>{related.map(item => <TypeCard category={item} locale={lang} products={catalog.products} key={item.id} />)}</div></section>}
    <section className={styles.section} id="faq"><div className={styles.sectionHead}><h2>{en ? "Frequently asked questions" : "ხშირი კითხვები"}</h2></div>
      <div className={styles.faq}>{faq.map(item => <div key={item.question} className={styles.faqItem}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div>
    </section>
    <section className={styles.contact}><div><h2>{en ? "Let’s discuss your version" : "შევქმნათ თქვენი ვერსია"}</h2><p className={styles.body}>{en ? "Tell us the quantity, preferred format and when you need it." : "მოგვწერეთ სასურველი რაოდენობა, ფორმატი და როდის გჭირდებათ დამზადება."}</p></div><ContactActions locale={lang} subject={name} context={category.slug} /></section>
    <footer className={styles.footer}><span>© {new Date().getFullYear()} KOKENI</span><Link href={`/${lang}/catalog`}>{en ? "Catalog" : "კატალოგი"} ↗</Link></footer>
  </main></div>;
}
