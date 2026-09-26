import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { localized, publicTypes, typePath } from "@/lib/catalog/typeCatalog";
import { composeCatalog } from "@/lib/catalog/composition";
import { familyEntrance } from "@/lib/catalog/familyView";
import FamilyCard from "@/components/catalog/FamilyCard";
import TypeCard from "@/components/catalog/TypeCard";
import CustomProjects from "@/components/catalog/CustomProjects";
import { sectorPath } from "@/lib/catalog/urls";
import { clip, pageMetadata } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import styles from "@/components/catalog/TypeCatalog.module.css";

export const dynamic = "force-dynamic";

async function loadCatalog() {
  const catalog = await getCatalogSnapshot();
  const types = publicTypes(catalog.groups, catalog.categories);
  return { catalog, types, composition: composeCatalog(types) };
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (lang !== "ka" && lang !== "en") return {};
  const { composition } = await loadCatalog();
  const names = [...composition.families.map(family => localized(family.config.title, lang)), ...composition.others.map(type => localized(type.name, lang))];
  return pageMetadata({
    locale: lang,
    title: lang === "en" ? "Catalog: Diploma, Credential & Menu Covers, Notebooks, Folders | KOKENI" : "კატალოგი: დიპლომის, მოწმობის და მენიუს ყდები, ბლოკნოტები, საქაღალდეები | KOKENI",
    description: clip(lang === "en"
      ? `What we make to order: ${names.join(", ")}. See completed examples and order from KOKENI, Tbilisi.`
      : `რას ვამზადებთ შეკვეთით: ${names.join(", ")}. ნახეთ შესრულებული ნამუშევრები და შეუკვეთეთ KOKENI-ში, თბილისი.`),
    pathFor: locale => `/${locale}/catalog`,
  });
}

export default async function CatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "ka" && lang !== "en") notFound();
  const en = lang === "en";
  const { catalog, types, composition } = await loadCatalog();
  const groups = catalog.groups.filter(group => group.isActive && types.some(type => type.groupId === group.id)).sort((a, b) => a.order - b.order);
  const index = [...types].sort((a, b) => localized(a.name, lang).localeCompare(localized(b.name, lang), lang));
  return <div className={styles.page}>
    <JsonLd data={itemListJsonLd(en ? "Item types" : "ნივთის ტიპები", types.map(category => ({ name: localized(category.name, lang), path: typePath(lang, category) })))} />
    <main className={styles.wrap} data-ga-page="catalog_index">
      <header className={styles.intro}>
        <div><span className={styles.eyebrow}>KOKENI / {en ? "CATALOG" : "კატალოგი"}</span><h1>{en ? "What would you like us to make?" : "რისი დამზადება გსურთ?"}</h1></div>
        <p className={styles.body}>{en
          ? "Every piece is made to order: format, material, colour and branding are agreed with you. Start with the item and look at work we have already made."
          : "ყველა ნივთი ინდივიდუალური შეკვეთით მზადდება — ფორმატს, მასალას, ფერსა და ბრენდირებას თქვენთან ერთად ვათანხმებთ. დაიწყეთ ნივთით და ნახეთ უკვე შესრულებული ნამუშევრები."}</p>
      </header>

      {composition.families.length > 0
        ? <section aria-label={en ? "Main directions" : "ძირითადი მიმართულებები"} className={styles.families}>
          {composition.families.map((family, position) => {
            const entrance = familyEntrance(family, lang, catalog.products);
            return <FamilyCard key={family.config.id} family={family} locale={lang} index={position} {...entrance} />;
          })}
        </section>
        : <p className={styles.empty}>{en ? "The catalog is being prepared. Contact us about your project." : "კატალოგი მზადდება. თქვენი პროექტის განსახილველად დაგვიკავშირდით."}</p>}

      {composition.others.length > 0 && <section className={styles.others} aria-labelledby="other-items">
        <div className={styles.sectionHead}><h2 id="other-items">{en ? "Other items" : "სხვა ნივთები"}</h2><p>{en ? "Also made to order" : "რასაც ასევე ვამზადებთ"}</p></div>
        <div className={styles.typeGrid}>{composition.others.map(type => <TypeCard key={type.id} category={type} locale={lang} products={catalog.products} />)}</div>
      </section>}

      <CustomProjects locale={lang} />

      <section className={styles.indexes} aria-label={en ? "More ways in" : "სხვა გზები"}>
        {groups.length > 0 && <div>
          <h2>{en ? "By sector" : "სფეროს მიხედვით"}</h2>
          <ul className={styles.indexList}>{groups.map(group => <li key={group.id}><Link href={sectorPath(lang, group)} data-ga-event="select_content" data-ga-content-type="catalog_sector" data-ga-content-id={group.slug}>{localized(group.name, lang)}</Link></li>)}</ul>
        </div>}
        <div>
          <h2>{en ? "All item types, A–Z" : "ყველა ნივთი ანბანურად"}</h2>
          <ul className={`${styles.indexList} ${styles.indexColumns}`}>{index.map(type => <li key={type.id}><Link href={typePath(lang, type)}>{localized(type.name, lang)}</Link></li>)}</ul>
        </div>
      </section>

      <footer className={styles.footer}><span>© {new Date().getFullYear()} KOKENI</span><span>{en ? "DESIGN · PROTOTYPE · MANUFACTURE" : "დიზაინი · პროტოტიპი · წარმოება"}</span></footer>
    </main>
  </div>;
}
