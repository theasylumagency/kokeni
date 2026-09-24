import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { illustrationFor, localized, publicTypes, typeCover, typeExamples, typePath } from "@/lib/catalog/typeCatalog";
import { productPath } from "@/lib/catalog/urls";
import TypeDrawing from "@/components/catalog/TypeDrawing";
import TypeCard from "@/components/catalog/TypeCard";
import TypeExamples from "@/components/catalog/TypeExamples";
import AttributeList from "@/components/catalog/AttributeList";
import styles from "@/components/catalog/TypeCatalog.module.css";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; typeSlug: string }> };
const findType = cache(async (slug: string) => {
  const catalog = await getCatalogSnapshot();
  const categories = publicTypes(catalog.groups, catalog.categories);
  const category = categories.find(category => category.slug === slug || category.legacySlugs?.includes(slug));
  return category ? { catalog, categories, category } : null;
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, typeSlug } = await params;
  const match = await findType(typeSlug);
  if (!match || (lang !== "en" && lang !== "ka")) return {};
  return { title: `${localized(match.category.name, lang)} | KOKENI`, description: localized(match.category.description, lang) || undefined, alternates: { canonical: typePath(lang, match.category), languages: { ka: typePath("ka", match.category), en: typePath("en", match.category) } } };
}
export default async function ItemTypePage({ params }: Props) {
  const { lang, typeSlug } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const match = await findType(typeSlug);
  if (!match) notFound();
  const { catalog, categories, category } = match;
  if (category.slug !== typeSlug) permanentRedirect(typePath(lang, category));
  const name = localized(category.name, lang);
  const description = localized(category.description, lang);
  const examples = typeExamples(category, catalog.products);
  const cover = typeCover(category, catalog.products);
  const group = catalog.groups.find(group => group.id === category.groupId)!;
  const related = (category.relatedCategoryIds || []).map(id => categories.find(item => item.id === id && item.id !== category.id)).filter(item => item !== undefined);
  const contact = `mailto:manufacturing@kokeni.ge?subject=${encodeURIComponent(name)}`;
  return <div className={styles.page}><main className={styles.wrap}>
    <nav className={styles.breadcrumb} aria-label={lang === "en" ? "Breadcrumb" : "ნავიგაცია"}><Link href={`/${lang}/catalog`}>{lang === "en" ? "All item types" : "ყველა ნივთის ტიპი"}</Link><span>/</span><span>{name}</span></nav>
    <header className={styles.typeHero}>
      <div><span className={styles.eyebrow}>KOKENI / {lang === "en" ? "MADE TO ORDER" : "მზადდება შეკვეთით"}</span><h1>{name}</h1><p className={styles.body}>{description || (lang === "en" ? "Explore completed examples as a starting point. We will discuss the format, materials and details for your order." : "ნახეთ შესრულებული ნამუშევრები და შეარჩიეთ საწყისი მაგალითი. თქვენი შეკვეთის ფორმატს, მასალასა და დეტალებს ერთად შევათანხმებთ.")}</p>
        <a className={styles.button} href={contact}>{lang === "en" ? "Discuss an order" : "შეკვეთის განხილვა"} ↗</a><a className={styles.textLink} href="#examples">{lang === "en" ? "View examples" : "ნამუშევრების ნახვა"} ↓</a>
        {related.length > 0 && <a className={styles.textLink} style={{ display: "block", marginLeft: 0 }} href="#related">{lang === "en" ? "Items to order together" : "რა შეიძლება შეუკვეთოთ ამ ნივთთან ერთად"} ↓</a>}
      </div>
      <div className={styles.heroVisual}>{cover ? <Image src={cover.images[0].src} alt={localized(cover.name, lang)} fill unoptimized sizes="(max-width:600px) 100vw, 50vw" loading="eager" /> : <TypeDrawing kind={illustrationFor(category)} />}<span className={styles.heroCaption}>{cover ? (lang === "en" ? "COMPLETED EXAMPLE" : "შესრულებული ნამუშევარი") : (lang === "en" ? "SCHEMATIC ILLUSTRATION" : "სქემატური გამოსახულება")}</span></div>
    </header>
    {!!category.customization?.length && <section className={styles.section}><div className={styles.sectionHead}><h2>{lang === "en" ? "Make it your own" : "რა შეიძლება შეიცვალოს"}</h2></div><AttributeList attributes={category.customization} locale={lang} /><p className={styles.body} style={{ marginTop: 16, fontSize: 12 }}>{lang === "en" ? "We confirm compatible materials, details and quantities when discussing your order." : "მასალების, დეტალებისა და რაოდენობის შესაბამისობას შეკვეთის განხილვისას ვაზუსტებთ."}</p></section>}
    <section className={styles.section} id="examples"><div className={styles.sectionHead}><h2>{lang === "en" ? "Completed examples" : "შესრულებული ნამუშევრები"}</h2><p>{lang === "en" ? "Choose a starting point for your order" : "შეარჩიეთ საწყისი მაგალითი თქვენი შეკვეთისთვის"}</p></div><TypeExamples locale={lang} examples={examples.map(product => ({ id: product.id, name: localized(product.name, lang), code: product.code || product.slug, href: productPath(lang, group.slug, product), image: product.images[0]?.src, specifications: product.specifications || [] }))} /></section>
    {related.length > 0 && <section className={styles.section} id="related"><div className={styles.sectionHead}><h2>{lang === "en" ? "To go with it" : "ამ ნივთთან ერთად"}</h2><p>{lang === "en" ? "Discuss a coordinated set" : "შევათანხმოთ ერთიანი ნაკრები"}</p></div><div className={styles.grid} style={{ paddingBottom: 0 }}>{related.map((item, index) => <TypeCard category={item} locale={lang} count={typeExamples(item, catalog.products).length} index={index} key={item.id} />)}</div></section>}
    <section className={styles.contact}><div><h2>{lang === "en" ? "Let’s discuss your version" : "შევქმნათ თქვენი ვერსია"}</h2><p className={styles.body}>{lang === "en" ? "Tell us the quantity, preferred format and when you need it." : "მოგვწერეთ სასურველი რაოდენობა, ფორმატი და როდის გჭირდებათ დამზადება."}</p></div><a className={styles.button} href={contact}>{lang === "en" ? "Get in touch" : "დაგვიკავშირდით"} ↗</a></section>
    <footer className={styles.footer}><span>© {new Date().getFullYear()} KOKENI</span><Link href={`/${lang}/catalog`}>{lang === "en" ? "All item types" : "ყველა ნივთის ტიპი"} ↗</Link></footer>
  </main></div>;
}
