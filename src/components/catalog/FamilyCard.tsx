import Image from "next/image";
import Link from "next/link";
import type { Locale, TypeIllustration } from "@/lib/catalog/types";
import type { ResolvedFamily } from "@/lib/catalog/composition";
import { sameStem } from "@/lib/catalog/composition";
import { localized, typePath } from "@/lib/catalog/typeCatalog";
import TypeDrawing from "./TypeDrawing";
import styles from "./TypeCatalog.module.css";

type Props = {
  family: ResolvedFamily;
  locale: Locale;
  index: number;
  href: string;
  drawing: TypeIllustration;
  photo?: { src: string; alt: string };
  count: number;
};

/**
 * One main direction on the catalog entrance. Separate interactive regions, never nested:
 * the drawing and the title lead to the family's entrance (primary item or landing page),
 * each member name leads to its own item page.
 */
export default function FamilyCard({ family, locale, index, href, drawing, photo, count }: Props) {
  const title = localized(family.config.title, locale);
  const lede = localized(family.config.lede, locale);
  const members = family.members;
  // A single member is only listed when its name says something the title does not.
  const showMembers = members.length > 1 || family.landing || !sameStem(localized(members[0].name, locale), title);
  const ga = { "data-ga-event": "select_content", "data-ga-content-type": "catalog_family", "data-ga-content-id": family.config.id };
  return <article className={styles.family}>
    <Link href={href} className={`${styles.familyVisual} ${photo ? styles.withPhoto : ""}`} tabIndex={-1} aria-hidden="true" {...ga}>
      <span className={styles.familyMeta}><span>{String(index + 1).padStart(2, "0")}</span>{count > 0 && <span>{count} {locale === "en" ? (count === 1 ? "example" : "examples") : "ნამუშევარი"}</span>}</span>
      <span className={styles.familyDrawing}><TypeDrawing kind={drawing} /></span>
      {photo && <span className={styles.familyPhoto}><Image src={photo.src} alt="" fill unoptimized sizes="(max-width:640px) 40vw, 360px" loading="lazy" /></span>}
    </Link>
    <div className={styles.familyBody}>
      <h2><Link href={href} {...ga}>{title}<span className={styles.arrow} aria-hidden="true">↗</span></Link></h2>
      <p className={styles.familyLede}>{lede}</p>
      {showMembers && <ul className={styles.members} aria-label={locale === "en" ? `${title}: items` : `${title}: ნივთები`}>
        {members.map(member => <li key={member.id}><Link href={typePath(locale, member)} data-ga-event="select_content" data-ga-content-type="catalog_type" data-ga-content-id={member.slug}>{localized(member.name, locale)}</Link></li>)}
      </ul>}
    </div>
  </article>;
}
