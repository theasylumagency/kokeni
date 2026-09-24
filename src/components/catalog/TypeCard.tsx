import Link from "next/link";
import type { Category, Locale } from "@/lib/catalog/types";
import { illustrationFor, localized, typePath } from "@/lib/catalog/typeCatalog";
import TypeDrawing from "./TypeDrawing";
import styles from "./TypeCatalog.module.css";

export default function TypeCard({ category, locale, count, index = 0 }: { category: Category; locale: Locale; count: number; index?: number }) {
  return <Link href={typePath(locale, category)} className={styles.typeCard}>
    <div className={styles.drawing}><span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")} / KOKENI</span><TypeDrawing kind={illustrationFor(category)} /></div>
    <div className={styles.cardBody}>
      <h2>{localized(category.name, locale)}</h2>
      {localized(category.description, locale) && <p>{localized(category.description, locale)}</p>}
      <div className={styles.cardFoot}><span>{count > 0 ? `${count} ${locale === "en" ? "completed examples" : "შესრულებული ნამუშევარი"}` : locale === "en" ? "Discuss your requirements" : "შევათანხმოთ დეტალები"}</span><span className={styles.arrow} aria-hidden="true">↗</span></div>
    </div>
  </Link>;
}
