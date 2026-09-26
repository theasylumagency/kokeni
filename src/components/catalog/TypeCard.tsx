import Image from "next/image";
import Link from "next/link";
import type { Category, Locale, Product } from "@/lib/catalog/types";
import { illustrationFor, localized, leadTimeLabel, minQuantityLabel, typeCover, typeExamples, typePath } from "@/lib/catalog/typeCatalog";
import TypeDrawing from "./TypeDrawing";
import styles from "./TypeCatalog.module.css";

/** Compact item-type card: family landing pages, "Other items", "To go with it". */
export default function TypeCard({ category, locale, products, withPhoto = true }: { category: Category; locale: Locale; products: Product[]; withPhoto?: boolean }) {
  const count = typeExamples(category, products).length;
  const cover = withPhoto ? typeCover(category, products) : undefined;
  const photo = cover ? [...cover.images].sort((a, b) => a.order - b.order)[0]?.src : undefined;
  const terms = [minQuantityLabel(category.orderTerms, locale), leadTimeLabel(category.orderTerms, locale)].filter(Boolean).join(" · ");
  return <Link href={typePath(locale, category)} className={styles.typeCard} data-ga-event="select_content" data-ga-content-type="catalog_type" data-ga-content-id={category.slug}>
    <span className={`${styles.typeCardVisual} ${photo ? styles.withPhoto : ""}`}>
      <span className={styles.familyDrawing}><TypeDrawing kind={illustrationFor(category)} /></span>
      {photo && <span className={styles.familyPhoto}><Image src={photo} alt="" fill unoptimized sizes="160px" loading="lazy" /></span>}
    </span>
    <span className={styles.typeCardBody}>
      <span className={styles.typeCardName}>{localized(category.name, locale)}</span>
      <span className={styles.typeCardMeta}>{[count > 0 ? `${count} ${locale === "en" ? (count === 1 ? "example" : "examples") : "ნამუშევარი"}` : "", terms].filter(Boolean).join(" · ") || (locale === "en" ? "Made to order" : "მზადდება შეკვეთით")}</span>
    </span>
    <span className={styles.arrow} aria-hidden="true">↗</span>
  </Link>;
}
