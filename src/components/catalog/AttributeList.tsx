import type { CatalogAttribute, Locale } from "@/lib/catalog/types";
import { localized } from "@/lib/catalog/typeCatalog";
import styles from "./TypeCatalog.module.css";

export default function AttributeList({ attributes, locale }: { attributes: CatalogAttribute[]; locale: Locale }) {
  return <dl className={styles.attributes}>{attributes.map((attribute, index) => <div key={index} className={styles.attribute}><dt>{localized(attribute.label, locale)}</dt><dd>{localized(attribute.value, locale)}</dd></div>)}</dl>;
}
