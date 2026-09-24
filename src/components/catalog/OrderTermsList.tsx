import type { Locale, OrderTerms } from "@/lib/catalog/types";
import { localized, orderTermRows } from "@/lib/catalog/typeCatalog";
import styles from "./TypeCatalog.module.css";

/** Minimum quantity / production time / starting price. Renders nothing when no term is set. */
export default function OrderTermsList({ terms, locale, className }: { terms?: OrderTerms; locale: Locale; className?: string }) {
  const rows = orderTermRows(terms, locale);
  const note = localized(terms?.note, locale);
  if (!rows.length && !note) return null;
  return <div className={className}>
    {rows.length > 0 && <dl className={styles.terms}>{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}
    {note && <p className={styles.termsNote}>{note}</p>}
  </div>;
}
