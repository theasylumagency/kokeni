# Catalog by item type

The catalog entry lists active categories as item types. Each type has a page at
`/{lang}/catalog/types/{category.slug}`. Existing sector and product URLs stay valid.
The home page and its category selection/order are unchanged.

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
