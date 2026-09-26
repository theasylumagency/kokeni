import Link from "next/link";
import type { Category, Locale } from "@/lib/catalog/types";
import type { ResolvedFamily } from "@/lib/catalog/composition";
import { localized, typePath } from "@/lib/catalog/typeCatalog";
import { familyPath } from "@/lib/catalog/urls";
import styles from "./TypeCatalog.module.css";

/**
 * "You are inside this family" — a calm row near the top of an item page, not a cross-sell block.
 * Rendered only when the family has more than one member or its own landing page.
 */
export default function FamilyNav({ family, current, locale }: { family: ResolvedFamily; current: Category; locale: Locale }) {
  if (family.members.length < 2 && !family.landing) return null;
  const title = localized(family.config.title, locale);
  return <nav className={styles.familyNav} aria-label={locale === "en" ? `Product family: ${title}` : `ნივთების ოჯახი: ${title}`}>
    {family.landing
      ? <Link className={styles.familyNavTitle} href={familyPath(locale, family.config.id)}>{title}</Link>
      : <span className={styles.familyNavTitle}>{title}</span>}
    <ul>
      {family.members.map(member => <li key={member.id}>
        {member.id === current.id
          ? <span aria-current="page">{localized(member.name, locale)}</span>
          : <Link href={typePath(locale, member)} data-ga-event="select_content" data-ga-content-type="catalog_family_nav" data-ga-content-id={member.slug}>{localized(member.name, locale)}</Link>}
      </li>)}
    </ul>
  </nav>;
}
