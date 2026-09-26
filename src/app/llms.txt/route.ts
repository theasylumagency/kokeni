import { getCatalogSnapshot } from "@/lib/catalog/data";
import { leadTimeLabel, localized, minQuantityLabel, publicTypes, typePath } from "@/lib/catalog/typeCatalog";
import { BRAND, SITE_URL, absoluteUrl } from "@/lib/site";
import { composeCatalog } from "@/lib/catalog/composition";
import { familyPath } from "@/lib/catalog/urls";
import { CONTACT } from "@/lib/contact";

export const dynamic = "force-dynamic";

/** Plain-text summary for AI assistants (llms.txt convention): who we are, what we make, where to look. */
export async function GET(): Promise<Response> {
  const catalog = await getCatalogSnapshot();
  const types = publicTypes(catalog.groups, catalog.categories);
  const composition = composeCatalog(types);
  const line = (type: (typeof types)[number]) => {
    const terms = [minQuantityLabel(type.orderTerms, "en"), leadTimeLabel(type.orderTerms, "en")].filter(Boolean).join(", ");
    const description = localized(type.description, "en");
    const enName = localized(type.name, "en");
    return `- [${enName === type.name.ka ? enName : `${enName} / ${type.name.ka}`}](${absoluteUrl(typePath("en", type))})${description ? `: ${description}` : ""}${terms ? ` (${terms})` : ""}`;
  };
  const body = `# ${BRAND.name} (${BRAND.legalName.en} / ${BRAND.legalName.ka})

> Tbilisi-based manufacturer, established in ${BRAND.foundingYear}. Custom diploma covers, official document covers, menu covers, receipt presenters, document and card holders, notebooks and diaries, made to order in PVC (high-frequency welded and embossed) and genuine leather, for universities, public institutions, restaurants and companies.

- Address: ${BRAND.address.streetAddress.en}, ${BRAND.address.postalCode} ${BRAND.address.addressLocality.en}, Georgia (meetings by appointment)
- Phone: +995 32 238 65 89, ${CONTACT.phoneDisplay} (also WhatsApp and Viber)
- E-mail: ${CONTACT.email}
- Languages: Georgian (${SITE_URL}/ka), English (${SITE_URL}/en)

## Catalog

${composition.families.map(family => `### ${family.config.title.en || family.config.title.ka}${family.landing ? ` — ${absoluteUrl(familyPath("en", family.config.id))}` : ""}\n\n${family.members.map(line).join("\n")}`).join("\n\n")}
${composition.others.length ? `\n### Other items\n\n${composition.others.map(line).join("\n")}\n` : ""}${composition.unplaced.length ? `\n### More item types\n\n${composition.unplaced.map(line).join("\n")}\n` : ""}
Custom projects: objects that are not in the catalog are designed, prototyped and manufactured to order.

## Pages

- [Catalog](${SITE_URL}/en/catalog): main directions, other items and custom projects, with completed examples
- [Home](${SITE_URL}/en): company overview and contact details
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
