import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { localized, publicTypes, typeExamples, typePath } from "@/lib/catalog/typeCatalog";
import TypeCard from "@/components/catalog/TypeCard";
import ContactActions from "@/components/catalog/ContactActions";
import { sectorPath } from "@/lib/catalog/urls";
import { clip, pageMetadata } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import styles from "@/components/catalog/TypeCatalog.module.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (lang !== "ka" && lang !== "en") return {};
  const catalog = await getCatalogSnapshot();
  const names = publicTypes(catalog.groups, catalog.categories).map(category => localized(category.name, lang));
  return pageMetadata({
    locale: lang,
    title: lang === "en" ? "Catalog: Diploma, Menu & Document Covers, Notebooks | KOKENI" : "კატალოგი: დიპლომის, მენიუს და დოკუმენტის ყდები, ბლოკნოტები | KOKENI",
    description: clip(lang === "en"
      ? `What we make to order: ${names.join(", ")}. See completed examples and order from KOKENI, Tbilisi.`
      : `რას ვამზადებთ შეკვეთით: ${names.join(", ")}. ნახეთ შესრულებული ნამუშევრები და შეუკვეთეთ KOKENI-ში, თბილისი.`),
    pathFor: locale => `/${locale}/catalog`,
  });
}

export default async function CatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const catalog = await getCatalogSnapshot();
  const categories = publicTypes(catalog.groups, catalog.categories);
  const groups = catalog.groups.filter(group => group.isActive).sort((a, b) => a.order - b.order);
  return <div className={styles.page}>
    <JsonLd data={itemListJsonLd(lang === "en" ? "Item types" : "ნივთის ტიპები", categories.map(category => ({ name: localized(category.name, lang), path: typePath(lang, category) })))} />
    <main className={styles.wrap} data-ga-page="catalog_index">
    <header className={styles.intro}>
      <div><span className={styles.eyebrow}>KOKENI / {lang === "en" ? "CATALOG" : "კატალოგი"}</span><h1>{lang === "en" ? "What would you like us to make?" : "რისი დამზადება გსურთ?"}</h1></div>
      <p className={styles.body}>{lang === "en" ? "Start with the item. Explore completed work and discuss the format, material and details for your organisation." : "აირჩიეთ ნივთის ტიპი, ნახეთ შესრულებული ნამუშევრები და შევათანხმოთ თქვენი ორგანიზაციისთვის საჭირო ფორმატი, მასალა და დეტალები."}</p>
    </header>
    <nav className={styles.jumpLinks} aria-label={lang === "en" ? "Item types" : "ნივთის ტიპები"}>{categories.map(category => <Link key={category.id} href={typePath(lang, category)}>{localized(category.name, lang)}</Link>)}</nav>
    {categories.length ? <div className={styles.grid}>{categories.map((category, index) => <TypeCard key={category.id} category={category} locale={lang} count={typeExamples(category, catalog.products).length} index={index} />)}</div> : <p className={styles.empty}>{lang === "en" ? "The catalog is being prepared. Contact us about your project." : "კატალოგი მზადდება. თქვენი პროექტის განსახილველად დაგვიკავშირდით."}</p>}
    <section className={styles.contact}><div><h2>{lang === "en" ? "Have a different idea?" : "სხვა იდეა გაქვთ?"}</h2><p className={styles.body}>{lang === "en" ? "Share your brief or a reference. We will discuss how it can be made." : "გაგვიზიარეთ ჩანაფიქრი ან მაგალითი — ერთად განვიხილოთ დამზადების შესაძლებლობა."}</p></div><ContactActions locale={lang} context="catalog_index" /></section>
    {groups.length > 0 && <section className={styles.secondary}><h2>{lang === "en" ? "Explore by sector" : "ნახეთ სფეროს მიხედვითაც"}</h2><div className={styles.secondaryLinks}>{groups.map(group => <Link key={group.id} href={sectorPath(lang, group)} data-ga-event="select_content" data-ga-content-type="catalog_sector" data-ga-content-id={group.slug}>{localized(group.name, lang)}</Link>)}</div></section>}
    <footer className={styles.footer}><span>© {new Date().getFullYear()} KOKENI</span><span>{lang === "en" ? "DESIGN · PROTOTYPE · PRODUCTION" : "დიზაინი · პროტოტიპი · წარმოება"}</span></footer>
  </main></div>;
}
