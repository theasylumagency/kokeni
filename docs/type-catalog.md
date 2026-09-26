# Catalog by item type

The item type (category) is still the primary axis of every public URL. The catalog entrance
is a presentation layer on top of the item types (see *Catalog composition* below).

| Page | URL |
|---|---|
| Catalog entrance | `/{lang}/catalog` |
| Item type | `/{lang}/catalog/{type}` |
| Family landing page | `/{lang}/catalog/{family}` (only `personal-documents` today) |
| Example (product) | `/{lang}/catalog/{type}/{code}` |
| Sector landing (secondary) | `/{lang}/catalog/sector/{group}` |

Old URLs redirect permanently (308): `/catalog/types/{type}` → `/catalog/{type}`,
`/catalog/{group}` → `/catalog/sector/{group}`, `/catalog/{group}/{code}` and
`/catalog/{group}/{category}/{legacy-slug}` → `/catalog/{type}/{code}`.
Item-type slugs never take the reserved segments `types`, `sector` or a family landing id.
The home page and its category selection/order are unchanged.

## Catalog composition

`src/lib/catalog/composition.ts` describes what the entrance shows. No flags on item types or examples.

- **Six main directions** (`CATALOG_FAMILIES`): Diploma cover, Credential cover, Restaurant menu and
  accessories, Notebooks, Folders, Personal documents. A *primary* family (Notebooks → Notebook)
  links its card to the first member; its other members are siblings. A *landing* family (Personal
  documents) has its own page and no promoted member. Diploma and credential covers have no siblings.
- **Other items** (`OTHER_PRODUCTS`): curated list, never a remainder bucket.
- **Custom projects**: a capability block (design → prototype → manufacture) with contact actions.
- Each reference is a list of candidate slugs; the first active type that matches (slug or legacy
  slug) is used, missing ones are skipped, a type is placed once. A family with no members is hidden.
- Types placed nowhere keep their page, sector links, sitemap entry and the A–Z index at the bottom
  of the entrance. `/admin/categories` → *კატალოგის შესასვლელი* shows what resolved, what is
  missing and what is not promoted.
- Item pages show a calm family row under the breadcrumb (e.g. *ბლოკნოტი · ყოველდღიური · კვირის
  დამგეგმავი*) when the family has more than one member; landing families also appear in the
  breadcrumb and BreadcrumbList.
- Variants stay examples with specifications; they never become types.

To add a new type to a direction: create it in the admin with an English name whose slug matches the
configured candidate (e.g. *Weekly planner* → `weekly-planner`), or add its slug to the family in
`composition.ts`.

## Drawings

Each type is marked by a technical drawing (`src/components/catalog/TypeDrawing.tsx`): orthographic,
heavy outline, dashed HF-weld seam, red dimensions and centre lines; formats only where standard
(A4, A5, ID-1, ID-3, 3×4). The drawing follows the type's name automatically; `/admin/categories`
can pin a specific one. Old saved generic values (`cover`, `holder`, `print`, and `menu` / `notebook` /
`box` when the name says otherwise) give way to the name. Where a published example has a photo, the
card pins it next to the drawing and, on hover, the photo takes over the sheet.

## Home hero

`src/components/home/HeroConstruction.tsx` draws one A4 diploma cover through the three words of the
subtitle: *design* (flat pattern, seam, folds, crest placement, dimensions), *prototype* (the sheet
tilts and folds into a white mock-up), *manufacture* (material, foil press, a stacked run). One clock
drives everything; the step buttons jump, a pause button stops the loop, it pauses off-screen, and
reduced-motion visitors see finished states only.

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
  the drawing (automatic by name, or pinned), list order, featured example,
  customization label/value rows and related item types. Below the table, the catalog
  entrance overview shows how the composition resolved.
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
legacy compatibility and unchanged home directions, catalog composition (order, candidates,
single placement, landing families, reserved slugs), drawing selection, plus existing photo workflows.
`npm run build` and TypeScript validation pass. The local browser review exercised
category and product save, filtering/reset, links, real photos, and a 390px layout.

## SEO, structured data and AI crawlers

- `src/lib/site.ts` — public origin (`NEXT_PUBLIC_SITE_URL`, default `https://kokeni.ge`), brand facts
  (legal name, address, phones, founding year, `sameAs` profile links) and the shared `pageMetadata()`
  builder: localized title/description, absolute canonical, hreflang ka/en/x-default, Open Graph, Twitter.
- `src/app/robots.ts`, `src/app/sitemap.ts` (all public types, examples, family landing pages and sectors
  in both languages), `src/app/llms.txt/route.ts` (plain-text company summary for AI assistants, grouped
  like the catalog entrance). `proxy.ts` skips any path
  with a file extension so these are not locale-redirected.
- JSON-LD (`src/lib/seo/jsonld.ts`): LocalBusiness + WebSite on every page; ItemList on the catalog;
  BreadcrumbList + ItemList + FAQPage on item types; BreadcrumbList + ItemList on family landing pages;
  BreadcrumbList + Product on examples (offers only when a fixed price or a "from" price is published).
- FAQ on item-type pages: questions on minimum order, production time, price and how to order are
  generated from the order terms; extra questions are entered per type in `/admin/categories`.
- `next.config.ts`: metadata is always rendered in `<head>` (`htmlLimitedBots: /.*/`); old Joomla URLs
  still in Google's index redirect permanently.
- `/admin` is `noindex` and disallowed in robots.txt.
