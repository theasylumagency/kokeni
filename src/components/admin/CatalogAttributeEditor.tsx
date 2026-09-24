"use client";

import { useState } from "react";
import type { CatalogAttribute } from "@/lib/catalog/types";

const inputClass = "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-blue-600";

export default function CatalogAttributeEditor({ name, initial = [], title, help }: {
  name: string; initial?: CatalogAttribute[]; title: string; help: string;
}) {
  const [rows, setRows] = useState(() => initial.map((row, index) => ({ ...row, key: index })));
  function change(index: number, field: "label" | "value", locale: "ka" | "en", value: string) {
    setRows(current => current.map((row, position) => position === index ? { ...row, [field]: { ...row[field], [locale]: value } } : row));
  }
  return <fieldset className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
    <legend className="px-1 text-sm font-semibold text-gray-900">{title}</legend>
    <p className="text-sm leading-relaxed text-gray-600">{help}</p>
    <input type="hidden" name={name} value={JSON.stringify(rows.map(({ label, value }) => ({ label, value })))} />
    {rows.map((row, index) => <div key={row.key} className="space-y-3 rounded-md border border-gray-200 bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-gray-700">მახასიათებელი (ქართულად)<input className={inputClass} required maxLength={500} value={row.label.ka} onChange={event => change(index, "label", "ka", event.target.value)} placeholder="მაგ. მასალა" /></label>
        <label className="text-xs text-gray-700">მნიშვნელობა (ქართულად)<input className={inputClass} required maxLength={500} value={row.value.ka} onChange={event => change(index, "value", "ka", event.target.value)} placeholder="მაგ. ნატურალური ტყავი" /></label>
      </div>
      <details><summary className="cursor-pointer text-xs text-gray-600">ინგლისური თარგმანი (არასავალდებულო)</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-gray-700">Attribute (EN)<input className={inputClass} maxLength={500} value={row.label.en || ""} onChange={event => change(index, "label", "en", event.target.value)} /></label>
        <label className="text-xs text-gray-700">Value (EN)<input className={inputClass} maxLength={500} value={row.value.en || ""} onChange={event => change(index, "value", "en", event.target.value)} /></label>
      </div></details>
      <button type="button" onClick={() => setRows(current => current.filter((_, position) => position !== index))} className="text-xs font-medium text-red-700">მახასიათებლის წაშლა</button>
    </div>)}
    <button type="button" disabled={rows.length >= 24} onClick={() => setRows(current => [...current, { key: Math.max(-1, ...current.map(row => row.key)) + 1, label: { ka: "" }, value: { ka: "" } }])} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 disabled:opacity-50">+ მახასიათებლის დამატება</button>
  </fieldset>;
}
