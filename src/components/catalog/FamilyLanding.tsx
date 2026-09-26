import Link from "next/link";
import type { Locale, Product } from "@/lib/catalog/types";
import type { ResolvedFamily } from "@/lib/catalog/composition";
import { illustrationFor, localized, typePath } from "@/lib/catalog/typeCatalog";
import { familyPath } from "@/lib/catalog/urls";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import TypeDrawing from "./TypeDrawing";
import TypeCard from "./TypeCard";
import ContactActions from "./ContactActions";
import styles from "./TypeCatalog.module.css";

/**
 * Landing page of a family whose members are different objects rather than variants of one
 * (passport cover, ID holder, certificate covers). No member is promoted to "the" product.
 */
export default function FamilyLanding({ family, locale, products }: { family: ResolvedFamily; locale: Locale; products: Product[] }) {
  const en = locale === "en";
  const title = localized(family.config.title, locale);
  const catalogLabel = en ? "Catalog" : "კატალოგი";
  return <div className={styles.page}>
    <JsonLd data={breadcrumbJsonLd([{ name: catalogLabel, path: `/${locale}/catalog` }, { name: title, path: familyPath(locale, family.config.id) }])} />
    <JsonLd data={itemListJsonLd(title, family.members.map(member => ({ name: localized(member.name, locale), path: typePath(locale, member) })))} />
    <main className={styles.wrap} data-ga-page="catalog_family" data-ga-list={`family/${family.config.id}`}>
      <nav className={styles.breadcrumb} aria-label={en ? "Breadcrumb" : "ნავიგაცია"}><Link href={`/${locale}/catalog`}>{catalogLabel}</Link><span>/</span><span aria-current="page">{title}</span></nav>
      <header className={styles.typeHero}>
        <div>
          <span className={styles.eyebrow}>KOKENI / {en ? "MADE TO ORDER" : "მზადდება შეკვეთით"}</span>
          <h1>{title}</h1>
          <p className={styles.body}>{localized(family.config.intro || family.config.lede, locale)}</p>
          <ContactActions locale={locale} subject={title} context={`family_${family.config.id}`} />
        </div>
        {family.members.length > 1
          ? <div className={`${styles.heroVisual} ${styles.heroSheet}`} aria-hidden="true">
            {family.members.slice(0, 4).map((member, index) => <span key={member.id} className={styles.heroSheetCell}>
              <span className={styles.heroSheetLabel}>{String(index + 1).padStart(2, "0")} · {localized(member.name, locale)}</span>
              <TypeDrawing kind={illustrationFor(member)} />
            </span>)}
          </div>
          : <div className={styles.heroVisual}><span className={styles.familyDrawing}><TypeDrawing kind={family.config.drawing || illustrationFor(family.members[0])} /></span><span className={styles.heroCaption}>{en ? "SCHEMATIC DRAWING" : "სქემატური ნახაზი"}</span></div>}
      </header>
      <section className={styles.section} aria-labelledby="family-items">
        <div className={styles.sectionHead}><h2 id="family-items">{en ? "Choose the item" : "აირჩიეთ ნივთი"}</h2><p>{en ? "Each has its own examples and options" : "თითოეულს თავისი ნამუშევრები და შესაძლებლობები აქვს"}</p></div>
        <div className={`${styles.typeGrid} ${styles.typeGridLarge}`}>{family.members.map(member => <TypeCard key={member.id} category={member} locale={locale} products={products} />)}</div>
      </section>
      <section className={styles.contact}><div><h2>{en ? "Something similar you need?" : "მსგავსი რამ გჭირდებათ?"}</h2><p className={styles.body}>{en ? "Tell us the document, the quantity and when you need it." : "მოგვწერეთ, რომელი დოკუმენტისთვის, რა რაოდენობით და როდის გჭირდებათ."}</p></div><ContactActions locale={locale} subject={title} context={`family_${family.config.id}`} /></section>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} KOKENI</span><Link href={`/${locale}/catalog`}>{catalogLabel} ↗</Link></footer>
    </main>
  </div>;
}
