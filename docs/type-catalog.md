# Catalog by item type

The catalog entry lists active categories as item types. The item type is the primary
axis of every public URL:

| Page | URL |
|---|---|
| Catalog entry | `/{lang}/catalog` |
| Item type | `/{lang}/catalog/{type}` |
| Example (product) | `/{lang}/catalog/{type}/{code}` |
| Sector landing (secondary) | `/{lang}/catalog/sector/{group}` |

Old URLs redirect permanently (308): `/catalog/types/{type}` → `/catalog/{type}`,
`/catalog/{group}` → `/catalog/sector/{group}`, `/catalog/{group}/{code}` and
`/catalog/{group}/{category}/{legacy-slug}` → `/catalog/{type}/{code}`.
Item-type slugs never take the reserved segments `types` and `sector`.
The home page and its category selection/order are unchanged.

## Contact

Type, example and catalog-entry pages show WhatsApp, Viber, phone and e-mail
(`src/components/catalog/ContactActions.tsx`). The message is pre-filled with the
type or example code plus quantity / deadline / organisation prompts. Numbers and
e-mail live in one place: `src/lib/contact.ts`.

## Order terms

Each item type can carry optional order terms (`/admin/categories` → შეკვეთის პირობები):
minimum quantity, production time in working days (from–to), starting unit price in GEL
and a short note. Empty fields are not shown. Without a starting price the site keeps
"ფასი: შეთანხმებით"; a fixed price on an individual example takes precedence.

## Analytics

Catalog GA4 events read `data-ga-*` attributes rather than parsing URLs:
product cards carry `data-ga-item-id/name/category/category2`, the page root carries
`data-ga-page` and `data-ga-list` (list pages) or `data-ga-view-*` (example page).
Contact buttons send `generate_lead` with `method` = whatsapp / viber / phone_mobile / email
and `lead_context` = type slug or example code.

## Administration

- **ნივთის ტიპები** (`/admin/categories`): edit Georgian/English descriptions,
  the schematic illustration, optional catalog-only position, featured example,
  customization label/value rows and related item types.
- **ნამუშევრები** (`/admin/products`): add factual specification label/value rows
  to individual examples. Use consistent Georgian attribute labels and values.
  Type pages create filters where an attribute has more than one distinct value.
- Related types must be selected explicitly. Inactive types and unpublished examples
  are hidden. Missing translations fall back to Georgian. Empty fields are omitted.
- Existing records need no migration. New fields are optional; legacy callers preserve
  previously saved fields when those fields are omitted.

## Deployment and data preservation

Deploy source changes only. Do not replace server `data/` or `public/uploads/` with
local files: live content is newer than the original local checkout. The isolated
review copy uses an abbreviated snapshot of public examples with local demo settings;
it is not an authoritative backup and must not be deployed as data.

## Validation

`npm test` exercises persistence, clearing, validation, publication boundaries,
legacy compatibility and unchanged home directions, plus existing photo workflows.
`npm run build` and TypeScript validation pass. The local browser review exercised
category and product save, filtering/reset, links, real photos, and a 390px layout.

## SEO, structured data and AI crawlers

- `src/lib/site.ts` — public origin (`NEXT_PUBLIC_SITE_URL`, default `https://kokeni.ge`), brand facts
  (legal name, address, phones, founding year, `sameAs` profile links) and the shared `pageMetadata()`
  builder: localized title/description, absolute canonical, hreflang ka/en/x-default, Open Graph, Twitter.
- `src/app/robots.ts`, `src/app/sitemap.ts` (all public types, examples and sectors in both languages),
  `src/app/llms.txt/route.ts` (plain-text company summary for AI assistants). `proxy.ts` skips any path
  with a file extension so these are not locale-redirected.
- JSON-LD (`src/lib/seo/jsonld.ts`): LocalBusiness + WebSite on every page; ItemList on the catalog;
  BreadcrumbList + ItemList + FAQPage on item types; BreadcrumbList + Product on examples (offers only
  when a fixed price or a "from" price is published).
- FAQ on item-type pages: questions on minimum order, production time, price and how to order are
  generated from the order terms; extra questions are entered per type in `/admin/categories`.
- `next.config.ts`: metadata is always rendered in `<head>` (`htmlLimitedBots: /.*/`); old Joomla URLs
  still in Google's index redirect permanently.
- `/admin` is `noindex` and disallowed in robots.txt.
