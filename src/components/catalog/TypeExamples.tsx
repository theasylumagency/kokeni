"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogAttribute, Locale } from "@/lib/catalog/types";
import { localized } from "@/lib/catalog/typeCatalog";
import styles from "./TypeCatalog.module.css";

export type ExampleCard = { id: string; name: string; code: string; href: string; image?: string; specifications: CatalogAttribute[] };

export default function TypeExamples({ examples, locale }: { examples: ExampleCard[]; locale: Locale }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const facets = new Map<string, { label: string; values: Map<string, string> }>();
  for (const example of examples) for (const attribute of example.specifications) {
    const key = attribute.label.ka.trim().toLocaleLowerCase();
    const value = attribute.value.ka.trim();
    if (!facets.has(key)) facets.set(key, { label: localized(attribute.label, locale), values: new Map() });
    facets.get(key)!.values.set(value, localized(attribute.value, locale));
  }
  const filters = [...facets].filter(([, facet]) => facet.values.size > 1);
  const visible = examples.filter(example => Object.entries(selected).every(([key, value]) => !value || example.specifications.some(attribute => attribute.label.ka.trim().toLocaleLowerCase() === key && attribute.value.ka.trim() === value)));
  return <>
    {filters.length > 0 && <div className={styles.filters}>{filters.map(([key, facet]) => <label key={key}>{facet.label}<select value={selected[key] || ""} onChange={event => setSelected(current => ({ ...current, [key]: event.target.value }))}><option value="">{locale === "en" ? "All" : "ყველა"}</option>{[...facet.values].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}{Object.values(selected).some(Boolean) && <button type="button" onClick={() => setSelected({})}>{locale === "en" ? "Clear filters" : "ფილტრების გასუფთავება"}</button>}</div>}
    <p className="sr-only" role="status">{visible.length} {locale === "en" ? "examples" : "ნამუშევარი"}</p>
    {visible.length ? <div className={styles.examples}>{visible.map(example => <Link key={example.id} href={example.href} className={styles.example}>
      <div className={styles.exampleImage}>{example.image ? <Image src={example.image} alt={example.name} fill unoptimized sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 33vw" /> : <span className="flex h-full items-center justify-center text-sm">{locale === "en" ? "Photo coming soon" : "ფოტო დაემატება"}</span>}</div>
      <span className={styles.exampleCode}>{example.code.toUpperCase()}</span><h3>{example.name}</h3>
      <div className={styles.chips}>{example.specifications.slice(0, 4).map((attribute, index) => <span className={styles.chip} key={index}>{localized(attribute.label, locale)}: {localized(attribute.value, locale)}</span>)}</div>
      <span className={styles.body} style={{ fontSize: 12 }}>{locale === "en" ? "View this example" : "ნამუშევრის ნახვა"} ↗</span>
    </Link>)}</div> : <div className={styles.empty}>{examples.length ? (locale === "en" ? "No photographed example matches these filters. Clear the filters or contact us to discuss this combination." : "ამ მახასიათებლებით ნამუშევარი ჯერ არ არის ნაჩვენები. გაასუფთავეთ ფილტრები ან დაგვიკავშირდით სასურველი კომბინაციის განსახილველად.") : (locale === "en" ? "Examples will be added here. Contact us to discuss the format and finish you need." : "შესრულებული ნამუშევრები აქ დაემატება. სასურველი ფორმატისა და დამუშავების შესათანხმებლად დაგვიკავშირდით.")}</div>}
  </>;
}
