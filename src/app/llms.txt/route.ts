import { getCatalogSnapshot } from "@/lib/catalog/data";
import { leadTimeLabel, localized, minQuantityLabel, publicTypes, typePath } from "@/lib/catalog/typeCatalog";
import { BRAND, SITE_URL, absoluteUrl } from "@/lib/site";
import { CONTACT } from "@/lib/contact";

export const dynamic = "force-dynamic";

/** Plain-text summary for AI assistants (llms.txt convention): who we are, what we make, where to look. */
export async function GET(): Promise<Response> {
  const catalog = await getCatalogSnapshot();
  const types = publicTypes(catalog.groups, catalog.categories);
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

## Item types

${types.map(line).join("\n")}

## Pages

- [Catalog](${SITE_URL}/en/catalog): all item types with completed examples
- [Home](${SITE_URL}/en): company overview and contact details
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
