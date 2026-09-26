import type { Category } from "@/lib/catalog/types";
import type { Composition } from "@/lib/catalog/composition";
import { CATALOG_FAMILIES, OTHER_PRODUCTS } from "@/lib/catalog/composition";

/**
 * Read-only view of how src/lib/catalog/composition.ts resolved against the live item types:
 * what the catalog entrance shows, which configured slots found nothing, and which public types
 * are not promoted anywhere (they keep their own page, sector links, sitemap and the A–Z index).
 */
export default function CompositionOverview({ composition }: { composition: Composition }) {
  const name = (category: Category) => `${category.name.ka} (${category.slug})`;
  const missing = composition.slots.filter(slot => !slot.resolved && !slot.duplicate);
  const rows = [
    ...CATALOG_FAMILIES.map(family => ({ id: family.id, title: family.title.ka, landing: family.kind === "landing", slots: composition.slots.filter(slot => slot.family === family.id) })),
    { id: "other", title: "სხვა ნივთები", landing: false, slots: composition.slots.filter(slot => !slot.family) },
  ];
  return <details className="rounded-lg border border-gray-200 bg-white p-5 text-sm shadow-sm" open={missing.length > 0 || composition.unplaced.length > 0}>
    <summary className="cursor-pointer font-semibold text-gray-900">
      კატალოგის შესასვლელი — {composition.families.length} მიმართულება, {composition.others.length} სხვა ნივთი
      {missing.length > 0 && <span className="ml-2 font-normal text-amber-700">· {missing.length} ცარიელი ადგილი</span>}
      {composition.unplaced.length > 0 && <span className="ml-2 font-normal text-gray-500">· {composition.unplaced.length} ტიპი არ ჩანს შესასვლელში</span>}
    </summary>
    <p className="mt-3 text-gray-600">შესასვლელის შემადგენლობა კოდშია აღწერილი (<code>src/lib/catalog/composition.ts</code>) და ტიპს ემთხვევა მისი ბმულის (slug) მიხედვით. ცარიელი ადგილი ნიშნავს, რომ ასეთი აქტიური ტიპი ჯერ არ არსებობს — შექმენით ტიპი ინგლისური სახელით, რომლიდანაც ეს slug გამოვა, ან დაამატეთ არსებული ტიპის slug კონფიგურაციაში. ცარიელი ადგილი საიტზე არ ჩანს.</p>
    <table className="mt-4 w-full border-t border-gray-200">
      <tbody>
        {rows.map(row => <tr key={row.id} className="border-b border-gray-100 align-top">
          <th className="w-56 py-3 pr-4 text-left font-medium text-gray-900">{row.title}{row.landing && <span className="block text-xs font-normal text-gray-500">საკუთარი გვერდი: /catalog/{row.id}</span>}</th>
          <td className="py-3">
            <ul className="space-y-1">
              {row.slots.map((slot, index) => <li key={index} className={slot.resolved ? "text-gray-800" : "text-amber-700"}>
                {slot.resolved ? <>✓ {name(slot.resolved)}</> : slot.duplicate ? <>↺ უკვე სხვაგანაა ნაჩვენები: {slot.ref.join(" / ")}</> : <>○ ვერ მოიძებნა: {slot.ref.join(" / ")}</>}
              </li>)}
              {row.slots.length === 0 && <li className="text-gray-400">—</li>}
            </ul>
          </td>
        </tr>)}
        <tr className="align-top">
          <th className="w-56 py-3 pr-4 text-left font-medium text-gray-900">შესასვლელში არ ჩანს</th>
          <td className="py-3 text-gray-700">{composition.unplaced.length ? composition.unplaced.map(name).join(", ") : "—"}<span className="mt-1 block text-xs text-gray-500">ეს ტიპები ხელმისაწვდომია საკუთარი გვერდით, სფეროს გვერდზე, ანბანურ სიაში და sitemap-ში.</span></td>
        </tr>
      </tbody>
    </table>
    <p className="mt-3 text-xs text-gray-500">კონფიგურაციაში: {CATALOG_FAMILIES.length} მიმართულება, {OTHER_PRODUCTS.length} „სხვა ნივთი“.</p>
  </details>;
}
