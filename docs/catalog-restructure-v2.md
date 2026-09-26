# Kokeni Catalog Restructure — Context, Decisions and Implementation Brief

## Purpose of this document

We want to redesign the Kokeni catalog again.

This document is intentionally **not a pixel-level UI specification and not a prescribed implementation plan**.

It contains:

* the reasoning that led us here;
* what is wrong with the current catalog model from a user-facing perspective;
* the conceptual structure we have agreed on;
* distinctions between product types, product families, variants and related products;
* constraints that should not be violated;
* examples that explain the intended behavior.

Please first inspect the existing project, catalog implementation, current routes, data structures, components, SEO logic and available product data.

Then design and implement the solution you believe best expresses the principles described below.

You are explicitly free to improve the interaction model, visual hierarchy, component architecture, layout and implementation details if you see a better solution.

We do **not** want you to mechanically reproduce the examples in this brief.

---

# 1. Background: what Kokeni actually is

Kokeni should not be understood as a conventional online shop containing a large collection of independent SKUs.

The company is closer to a small design and manufacturing bureau.

Its real capability is:

**Design → Prototype → Manufacture**

Kokeni has a relatively limited number of fundamental product types, but each of those types can be produced in many different forms:

* different sizes;
* different materials;
* different internal constructions;
* different colors;
* different branding;
* embossing;
* printing;
* fittings;
* custom internal layouts;
* client-specific details.

This distinction is central.

Ten visually different diploma covers are not necessarily ten different products.

A red diploma cover manufactured for one university and a blue diploma cover manufactured for another university are examples of the same product type.

The public catalog therefore should not behave like a SKU grid.

At the same time, it must not become so abstract that users cannot recognize the thing they are looking for.

A customer searching for a diploma cover should immediately see **“Diploma Cover”**.

A restaurant looking for menu covers should immediately see that Kokeni manufactures menu covers.

Our internal conceptual sophistication must never replace the customer's vocabulary.

A useful principle for the entire catalog is:

> Conceptual structure may be ours. Terminology must remain the customer's.

---

# 2. Why the current catalog structure is not satisfactory

The current catalog architecture treats public item types too equally.

If ten types exist, the catalog can effectively show ten equally important entries.

This becomes increasingly problematic as more product types are added.

A business can legitimately manufacture:

* notebooks;
* diaries;
* weekly planners;
* waiter notebooks;
* binders;
* medal cases;
* passport covers;
* ID holders;
* menu covers;
* receipt presenters;
* diploma covers;
* employee credential covers;
* and many other things.

Technically these can all be distinct product types.

But:

> **A distinct product type does not automatically deserve an independent entrance on the main catalog page.**

This is the central problem we are trying to solve.

If every real product type becomes a large catalog card, the catalog becomes crowded and the business starts looking like a random collection of objects.

If we compress too aggressively into abstract categories, customers stop recognizing the products they actually came to find.

We need a middle layer based on **commercially meaningful main directions**.

---

# 3. Main catalog model

We currently believe the main catalog page should have three levels of emphasis:

## A. Six main directions

These receive the strongest visual presence.

They are the primary entrances into Kokeni's product catalog.

## B. Other Products

These are real, repeatable products with their own pages and examples, but they do not deserve the same visual importance as the six main directions.

## C. Custom Projects

This is not a product category.

It represents Kokeni's ability to design and manufacture something that does not yet exist in the catalog.

---

# 4. The six main directions

Our current agreed structure is:

1. **Diploma Cover**
2. **Credential Cover**
3. **Restaurant Menu and Accessories**
4. **Notebooks**
5. **Folders**
6. **Personal Documents**

Georgian public naming will naturally be used in the Georgian UI.

Current intended Georgian terminology:

1. **დიპლომის ყდა**
2. **მოწმობის ყდა**
3. **რესტორნის მენიუ და აქსესუარები**
4. **ბლოკნოტები**
5. **საქაღალდეები**
6. **პირადი დოკუმენტები**

These names are not meant to imply that all six directions have an identical internal structure.

That is important.

The UI must tolerate different family structures naturally rather than forcing artificial symmetry into the data.

---

# 5. Main direction vs actual product type

The six main catalog entries are primarily **navigation/commercial presentation constructs**.

They should not necessarily become a new persistent taxonomy layer imposed on every product record.

For example:

### Notebooks

The catalog entrance is:

**Notebooks**

But underneath it there may be multiple independent product types:

* Notebook
* Diary
* Weekly Planner

They are not merely configuration options of the same object.

They are legitimate independent products.

They may each have:

* their own URL;
* their own page;
* their own examples;
* their own metadata;
* their own specifications;
* their own SEO value.

They simply do not each need an equally large card on the main catalog page.

---

# 6. Product families and siblings

During discussion we identified an important relationship that is stronger than ordinary “related products”.

For working purposes, we call these:

**Family siblings**

A sibling is an independent product type that belongs naturally to the same commercial/product family.

The family members should help expose each other.

This relationship may appear:

* directly on the main catalog card;
* very subtly near the top of the product page;
* potentially elsewhere where useful.

The exact visual treatment is up to you.

The important part is that the family relationship should be discoverable without dominating the page.

---

# 7. Example: Notebooks

Main catalog entry:

## Notebooks

Primary/default product:

* Notebook

Sibling products:

* Diary
* Weekly Planner

A user clicking the main visual/title may enter the Notebook page.

But the main catalog card may also visibly indicate that Kokeni makes:

**Notebook · Diary · Weekly Planner**

Each sibling can be directly clickable.

On the Notebook product page, a subtle high-level family navigator could also allow movement between:

**Notebook · Diary · Weekly Planner**

If the user is on Diary, Diary becomes the active item.

This is a family relationship, not a product configuration.

---

# 8. Example: Restaurant Menu and Accessories

This direction helped clarify the sibling concept.

Primary product:

* Menu Cover

Sibling products:

* Receipt Presenter / Bill Presenter
* Waiter Notebook

These are not alternatives to a menu cover.

A restaurant may order all three.

However, commercially they belong together and often feed each other.

Someone arriving because they need menu covers should immediately be able to discover that Kokeni also manufactures receipt presenters and waiter notebooks.

Likewise, someone who enters directly onto a receipt-presenter product page should be able to discover the rest of the restaurant family.

Therefore these products should have stronger mutual visibility than arbitrary “related products”.

Important:

The waiter notebook should **not** primarily belong to the generic Notebook family simply because it physically resembles a notebook.

From a customer's point of view, it is much more naturally searched for and understood as a restaurant accessory.

This gives us an important rule:

> Products should primarily be grouped according to how customers understand and seek them, not according to purely physical similarity.

---

# 9. Example: Folders

Main direction:

## Folders

Primary/default product:

* Folder

Sibling:

* Binder

Earlier we considered calling the main direction:

“Folders and Binders”

We now believe **Folders** is cleaner.

A binder is essentially a particular type/form of folder in this commercial context.

However, “Binder” should still be visibly mentioned on the main catalog page because customers looking specifically for a binder must immediately understand that Kokeni manufactures them.

Therefore the Folders catalog card can expose Binder as a sibling.

Binder may still have its own independent product page and URL.

---

# 10. Diploma Cover

This is one of Kokeni's major directions.

It is also structurally very simple.

Main direction:

## Diploma Cover

Primary product:

* Diploma Cover

There is no need to invent sibling products merely to make the UI consistent.

Different diploma-cover executions are usually **variants/configurations/examples**, not different product types.

Possible variation dimensions include:

* size;
* orientation;
* corner treatment;
* internal fastening;
* material;
* color;
* embossing;
* screen printing;
* other branding methods;
* fittings;
* internal construction.

Do not create artificial sibling products to populate the design.

The system must gracefully support a main direction with **zero siblings**.

---

# 11. Credential Cover

This requires terminology clarification.

In Georgia, many organizations still issue traditional employee/member credentials consisting approximately of two small printed paper leaves, often showing:

* person's name;
* position;
* signature;
* seal;
* organization;
* potentially multiple languages.

These are common among:

* ministries;
* law-enforcement and security institutions;
* public bodies;
* academies;
* associations;
* other organizations.

Kokeni manufactures covers for these credentials.

This is a significant business direction.

This product is **not** the same thing as:

* passport covers;
* birth certificate covers;
* marriage certificate covers;
* ID-card holders.

Therefore the Georgian **„მოწმობის ყდა“** should be treated as its own primary product direction.

Main direction:

## Credential Cover / მოწმობის ყდა

Primary product:

* Credential Cover

Again, different executions are mostly configurations/examples.

Do not invent sibling products unless the actual product data later proves that meaningful sibling types exist.

---

# 12. Personal Documents

This family is different from the previous five.

Examples include:

* Passport Cover
* ID Card Holder
* Birth Certificate Cover
* Marriage Certificate Cover
* potentially other similar personal/civil documents.

These products are connected by user context, but they are physically and structurally different.

A passport cover is not a variant of an ID holder.

A birth-certificate cover is not a variant of a passport cover.

Therefore this direction should **not** artificially select one of these as the canonical product merely for consistency.

Our current preferred model is:

## Personal Documents → Family Landing Page

The family landing page can then expose the actual independent product types.

This is intentionally different from:

## Notebooks → Notebook page

The architecture and design should allow this asymmetry.

Do not force all six main directions through the same routing pattern if that makes the model less truthful.

---

# 13. Main catalog cards

The current catalog already uses large visual/type cards.

The exact design should be reconsidered.

We previously explored blueprint/schematic visual language, which may still be appropriate because Kokeni's identity is tied to:

* design;
* construction;
* prototyping;
* manufacturing.

However, the existing catalog redesign was not satisfactory, and we do not want to constrain the new solution to the current cards or drawings.

Please rethink the main catalog presentation.

One concept we consider promising:

A main-direction card may contain:

* strong representative visual;
* main direction name;
* primary product;
* compact sibling list where applicable.

For example:

**Notebooks**

Representative visual

`Notebook · Diary · Weekly Planner`

or:

**Restaurant Menu and Accessories**

Representative visual focused on Menu Cover

`Menu Cover · Receipt Presenter · Waiter Notebook`

However, this is a conceptual example rather than a mandatory component specification.

If you find a better interaction, use it.

---

# 14. Sibling visibility on product pages

We do not want sibling navigation to behave like an aggressive ecommerce cross-sell component.

It should be:

* visible;
* useful;
* calm;
* near the top-level context of the page;
* visually subordinate to the current product.

Think of it more as:

**“You are inside this product family.”**

rather than:

**“You may also like…”**

Example:

Restaurant family:

`Menu Cover · Receipt Presenter · Waiter Notebook`

Notebook family:

`Notebook · Diary · Weekly Planner`

Folder family:

`Folder · Binder`

No artificial family navigator is needed for Diploma Cover or Credential Cover unless actual siblings exist.

---

# 15. Variants are not siblings

This distinction must remain clear in implementation.

Example:

Diploma Cover with:

* metal corners;
* no metal corners;
* A4 size;
* another size;
* embossed logo;
* screen-printed logo;

is still **Diploma Cover**.

These are product attributes/configuration possibilities.

Do not create independent product types from every meaningful feature combination.

Likewise, we do not need a photograph/product record for every theoretical Cartesian combination of:

material × size × branding × corner × internal construction.

The goal is credible visual coverage of meaningful possibilities, not exhaustive SKU generation.

---

# 16. Other Products

After the six main directions, the catalog should contain a lower-emphasis section:

## Other Products

This should contain real products that Kokeni manufactures but which are:

* less frequently ordered;
* too narrow to deserve a primary catalog entrance;
* commercially secondary;
* or unusual enough that giving them equal prominence would distort the perception of the company.

Examples may include:

* Medal Case
* Presentation Box
* unusual cases/holders;
* other specialist products discovered in the existing data.

Important distinction:

A product can be highly specialized without deserving a main catalog direction.

For example, Medal Case is structurally distinctive, but if orders are rare, it should not consume the same visual space as Diploma Cover or Menu Cover.

### Critical rule

“Other Products” must **not** become an automatic dump of every category that is not assigned to one of the six main directions.

It should be intentionally curated.

Otherwise, after enough products are added, we recreate the original problem further down the page.

Other products can still have:

* independent URLs;
* complete product pages;
* images;
* metadata;
* SEO visibility;
* sitemap presence where appropriate;
* internal linking.

They simply receive lower prominence on the catalog index.

---

# 17. Custom Projects

After the regular catalog content, we want a clearly separate section:

## Custom Projects

This is **not a product category**.

It represents Kokeni's broader capability.

Conceptually:

> Have an object, idea, reference or construction that is not listed here?
>
> Kokeni can design it, prototype it and manufacture it.

This section should reinforce the company's real positioning:

**Design → Prototype → Manufacture**

This may be visually more expressive than a standard product section.

The CTA should lead into the appropriate contact/request flow.

---

# 18. Main Catalog overall hierarchy

Conceptually:

```text
CATALOG

Six Main Directions
┌─────────────┬─────────────┬─────────────┐
│ Direction 1 │ Direction 2 │ Direction 3 │
├─────────────┼─────────────┼─────────────┤
│ Direction 4 │ Direction 5 │ Direction 6 │
└─────────────┴─────────────┴─────────────┘

Other Products
[lower-emphasis curated products]

Custom Projects
[design / prototype / manufacture CTA]
```

The 3 × 2 grid is currently appealing because six directions fit naturally.

However:

**Do not sacrifice usability or responsive behavior just to preserve a literal desktop grid.**

The conceptual hierarchy matters more than exact geometry.

---

# 19. Exact six-direction structure currently agreed

## 1. Diploma Cover

Primary:

* Diploma Cover

Siblings:

* none required

---

## 2. Credential Cover

Primary:

* Credential Cover / მოწმობის ყდა

Siblings:

* none required

---

## 3. Restaurant Menu and Accessories

Primary:

* Menu Cover

Siblings:

* Receipt Presenter
* Waiter Notebook
* potentially other genuine restaurant-specific product types discovered later

---

## 4. Notebooks

Primary:

* Notebook

Siblings:

* Diary
* Weekly Planner

Waiter Notebook does **not** belong here as its primary family.

---

## 5. Folders

Primary:

* Folder

Sibling:

* Binder

Potentially other genuine folder forms may emerge after reviewing the complete product inventory.

---

## 6. Personal Documents

No mandatory primary product.

Use a family landing page.

Possible child products:

* Passport Cover
* ID Card Holder
* Birth Certificate Cover
* Marriage Certificate Cover
* other appropriate personal/civil-document products.

---

# 20. Existing sector/group dimension

The project already contains a separate sector-based grouping concept.

Examples may include institutional, hospitality, corporate and similar dimensions.

Do not confuse this with the new main catalog structure.

These answer different questions.

Main catalog:

> **What do you need?**

Sector navigation:

> **What context/industry is this for?**

For example:

Waiter Notebook belongs to the Restaurant family from the product-navigation perspective.

At the same time, it naturally belongs to Hospitality from the sector perspective.

This is useful and should remain possible.

Do not throw away valuable existing sector relationships merely because the catalog index is being redesigned.

---

# 21. Data architecture constraint

We explicitly want to avoid solving this problem by adding a large collection of per-product boolean flags such as:

* `showOnCatalog`
* `isPrimary`
* `isSibling`
* `featuredOnRoot`
* `showInFamily`
* etc.

This would spread presentation logic throughout the product records and eventually become difficult to manage.

Prefer a small, explicit catalog-composition/navigation configuration that describes the intended catalog presentation.

Conceptually, something like:

```text
notebooks
  title: Notebooks
  primary: notebook
  siblings:
    - diary
    - weekly-planner

restaurant
  title: Restaurant Menu and Accessories
  primary: menu-cover
  siblings:
    - receipt-presenter
    - waiter-notebook

folders
  title: Folders
  primary: folder
  siblings:
    - binder

personal-documents
  title: Personal Documents
  landing: family
  products:
    - passport-cover
    - id-card-holder
    - birth-certificate-cover
    - marriage-certificate-cover
```

This is only conceptual pseudocode.

Choose the cleanest implementation appropriate to the existing project architecture.

The important principle is:

> Catalog composition should not contaminate the underlying definition of a product type.

---

# 22. Do not unnecessarily migrate existing product data

Please inspect the existing data architecture before changing schemas.

Existing product types, URLs and records should be reused whenever possible.

Avoid unnecessary migrations.

If restructuring can be implemented largely as a presentation/navigation layer above current product types, that is preferable.

However, if you discover a genuinely better architectural solution, explain it in the implementation and use it.

---

# 23. Production data warning

The repository's local data may not contain the complete or latest production inventory.

Production/server data has previously been newer than the abbreviated repository snapshot.

Therefore:

* do not assume local JSON is the complete product inventory;
* do not destructively replace production data from repository fixtures;
* design the system so additional types can be incorporated safely.

The structure should work when more real products are added later.

---

# 24. URLs and SEO

Concrete product terms remain important.

People search for things such as:

* diploma cover;
* menu cover;
* passport cover;
* binder;
* notebook;
* etc.

The new catalog hierarchy must not destroy specific product landing pages.

Independent product types should still be able to have:

* their own URLs;
* indexable pages;
* metadata;
* structured data where currently supported;
* sitemap entries where appropriate.

A rare product should not disappear from search merely because it is not promoted on the catalog homepage.

Likewise, sibling products should remain directly addressable.

The main catalog page is a navigation/presentation hierarchy.

It is **not necessarily the canonical taxonomy for SEO**.

---

# 25. Internal linking

No product page should become an orphan merely because it is not one of the main six entries.

Use appropriate internal relationships:

* family navigation;
* Other Products;
* sector pages;
* contextual related links;
* sitemap;
* direct search landing pages.

This is especially important for lower-prominence products.

---

# 26. Terminology should remain literal and useful

Avoid replacing real product names with conceptual marketing abstractions.

Bad direction:

* “Hospitality Systems”
* “Document Ecosystems”
* “Flat Constructions”
* other language that customers are unlikely to search for or recognize.

Prefer concrete Georgian terminology.

Examples:

* დიპლომის ყდა
* მოწმობის ყდა
* ბლოკნოტი
* ბაინდერი
* მენიუს ყდა
* პასპორტის ყდა

The catalog can be conceptually sophisticated while the interface remains plain and understandable.

---

# 27. Visual direction

We are open to a substantial rethink.

Kokeni already has visual language around construction, blueprint/dieline thinking, prototyping and manufacturing.

A schematic/blueprint-inspired presentation may be appropriate if it feels like:

* real construction thinking;
* object design;
* manufacturing knowledge.

It should not feel like decorative “tech animation”.

Motion, if used, should communicate:

* form;
* construction;
* assembly;
* transformation;
* material/product logic.

Do not add motion merely because animation is possible.

Real product photography remains important.

The catalog must ultimately sell confidence that Kokeni has actually designed and manufactured these objects.

---

# 28. Desktop and mobile behavior

Do not treat mobile as a compressed desktop grid.

The catalog relationships must remain clear on smaller screens.

Especially consider how sibling links are presented without:

* clutter;
* tiny targets;
* accidental navigation;
* excessive vertical duplication.

The hierarchy should remain obvious:

Main direction → current product → sibling family → product content.

---

# 29. Interaction and accessibility note

If sibling product links appear inside what visually looks like a main catalog card, do not create invalid or confusing nested interactive elements.

For example, avoid making the entire card one anchor containing additional anchors.

Prefer clearly defined interactive regions:

* main image/title → primary product;
* sibling labels → their own URLs.

Ensure keyboard and screen-reader behavior remains sensible.

Exact implementation is up to you.

---

# 30. What we do NOT want

Please avoid the following outcomes:

### 1. Every product type gets an equally large catalog card

This is the problem we are trying to solve.

### 2. Artificial categories created only to achieve visual symmetry

If Diploma Cover has no sibling, leave it alone.

### 3. Product variants become separate products

Configuration is not taxonomy.

### 4. Extremely abstract naming

Users must recognize actual objects.

### 5. “Other Products” becomes an automatic remainder bucket

It must remain curated.

### 6. Custom Projects becomes a normal product category

It is a capability/CTA.

### 7. New presentation flags are scattered across every Category/Product record

Prefer centralized catalog composition.

### 8. Product SEO pages disappear because they are not on the main catalog index
