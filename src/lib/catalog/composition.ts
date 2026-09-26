import type { Category, LocalizedText, Product, TypeIllustration } from "./types";

/*
 * CATALOG COMPOSITION
 * -------------------
 * How the catalog index is put together. This is presentation, not taxonomy: item types
 * (categories) stay exactly as they are in data/categories.json — this file only says which of
 * them the catalog entrance shows, in which family, and in which order.
 *
 * A reference is a list of candidate item-type slugs; the first one that exists (slug or legacy
 * slug, active, in an active sector) is used. Missing types are skipped, so production data can
 * be ahead of or behind this file without breaking anything. /admin/categories shows what resolved.
 *
 * - `primary` families (Notebooks → Notebook page) link their card to the first resolved member.
 * - `landing` families (Personal documents) get their own page at /catalog/{id}.
 * - Each item type is placed at most once (first placement wins).
 * - OTHER_PRODUCTS is curated on purpose. Types that are placed nowhere keep their pages,
 *   sitemap entries, sector links and the A–Z index; they are just not promoted.
 */

export type TypeRef = readonly string[];

type FamilyBase = {
  /** Stable key. For landing families it is also the URL segment: /catalog/{id}. */
  id: string;
  title: LocalizedText;
  /** One plain line under the title on the catalog card. */
  lede: LocalizedText;
  /** Drawing for the card. Primary families default to their first member's drawing. */
  drawing?: TypeIllustration;
  /** Longer introduction for a landing page (falls back to the lede). */
  intro?: LocalizedText;
};

export type PrimaryFamily = FamilyBase & { kind: "primary"; primary: TypeRef; siblings: readonly TypeRef[] };
export type LandingFamily = FamilyBase & { kind: "landing"; members: readonly TypeRef[] };
export type FamilyConfig = PrimaryFamily | LandingFamily;

export const CATALOG_FAMILIES: readonly FamilyConfig[] = [
  {
    kind: "primary",
    id: "diploma",
    title: { ka: "დიპლომის ყდა", en: "Diploma cover" },
    lede: { ka: "ზომა, მასალა, ფერი, კუთხეები და ლოგოს ტვიფრი — თქვენი დაწესებულებისთვის.", en: "Size, material, colour, corners and embossed crest — made for your institution." },
    primary: ["diploma-cover", "diploma"],
    siblings: [],
  },
  {
    kind: "primary",
    id: "credential",
    title: { ka: "მოწმობის ყდა", en: "Credential cover" },
    lede: { ka: "თანამშრომლისა და წევრის მოწმობის ყდები უწყებებისა და ორგანიზაციებისთვის.", en: "Covers for staff and member credentials of public bodies and organisations." },
    primary: ["credential-cover", "motsmobis-qda", "ofitsialuri-dokumentis-qdebi"],
    siblings: [],
  },
  {
    kind: "primary",
    id: "restaurant",
    title: { ka: "რესტორნის მენიუ და აქსესუარები", en: "Restaurant menus and accessories" },
    lede: { ka: "მენიუს ყდა, ანგარიშის ჩასადები და მიმტანის ბლოკნოტი — ერთ სტილში.", en: "Menu covers, bill presenters and waiter pads — made as one set." },
    primary: ["menu-cover", "menu"],
    siblings: [["receipt-presenter", "bill-presenter", "receipt"], ["waiter-notebook", "waiters-notebook"]],
  },
  {
    kind: "primary",
    id: "notebooks",
    title: { ka: "ბლოკნოტები", en: "Notebooks" },
    lede: { ka: "ბრენდირებული ბლოკნოტები, ყოველდღიურები და დამგეგმავები.", en: "Branded notebooks, diaries and planners." },
    primary: ["notebook"],
    siblings: [["diary"], ["weekly-planner", "planner"]],
  },
  {
    kind: "primary",
    id: "folders",
    title: { ka: "საქაღალდეები", en: "Folders" },
    lede: { ka: "საქაღალდეები და ბაინდერები დოკუმენტებისა და პრეზენტაციისთვის.", en: "Folders and binders for documents and presentations." },
    primary: ["folder", "document-folder", "document-and-card-holder"],
    siblings: [["binder", "ring-binder"]],
  },
  {
    kind: "landing",
    id: "personal-documents",
    title: { ka: "პირადი დოკუმენტები", en: "Personal documents" },
    lede: { ka: "ყდები და ჩასადები პასპორტის, ID ბარათისა და დაბადების ან ქორწინების მოწმობისთვის.", en: "Covers and holders for passports, ID cards, birth and marriage certificates." },
    intro: {
      ka: "პასპორტის, პირადობის ბარათის, დაბადებისა და ქორწინების მოწმობის ყდები — თითოეული საკუთარი ზომითა და კონსტრუქციით. აირჩიეთ ნივთი და ნახეთ შესრულებული ნამუშევრები.",
      en: "Covers for passports, ID cards, birth and marriage certificates — each with its own size and construction. Choose the item to see completed work.",
    },
    drawing: "passport",
    members: [["passport-cover"], ["id-card-holder", "id-holder", "card-holder"], ["birth-certificate-cover"], ["marriage-certificate-cover"]],
  },
];

/** Real, repeatable products that deserve a page but not a main entrance. Curated — never a remainder bucket. */
export const OTHER_PRODUCTS: readonly TypeRef[] = [
  ["medal-case", "medal-box"],
  ["presentation-box"],
];

/** URL segments owned by landing families; item-type slugs must never take them. */
export const LANDING_SLUGS: readonly string[] = CATALOG_FAMILIES.filter(family => family.kind === "landing").map(family => family.id);

export type ResolvedFamily = {
  config: FamilyConfig;
  /** Primary first for primary families; landing families keep the configured order. */
  members: Category[];
  /** Card target: the first member (primary families) or the landing page (landing families). */
  landing: boolean;
};

export type CompositionSlot = { family?: string; ref: TypeRef; resolved?: Category; duplicate?: boolean };

export type Composition = {
  families: ResolvedFamily[];
  others: Category[];
  /** Public item types that are placed nowhere (still reachable: own page, sector, sitemap, A–Z). */
  unplaced: Category[];
  /** Every configured reference and what it resolved to — for the admin overview. */
  slots: CompositionSlot[];
};

const matches = (category: Category, slug: string) => category.slug === slug || Boolean(category.legacySlugs?.includes(slug));

/** Resolve the configuration against the public item types (already filtered to active ones). */
export function composeCatalog(types: Category[], families: readonly FamilyConfig[] = CATALOG_FAMILIES, others: readonly TypeRef[] = OTHER_PRODUCTS): Composition {
  const placed = new Set<string>();
  const slots: CompositionSlot[] = [];
  const take = (ref: TypeRef, family?: string): Category | undefined => {
    let found: Category | undefined;
    for (const slug of ref) { found = types.find(type => matches(type, slug)); if (found) break; }
    const duplicate = Boolean(found && placed.has(found.id));
    slots.push({ family, ref, resolved: duplicate ? undefined : found, duplicate });
    if (!found || duplicate) return undefined;
    placed.add(found.id);
    return found;
  };
  const resolvedFamilies = families.map(config => {
    const refs = config.kind === "primary" ? [config.primary, ...config.siblings] : config.members;
    const members = refs.map(ref => take(ref, config.id)).filter((item): item is Category => Boolean(item));
    return { config, members, landing: config.kind === "landing" };
  }).filter(family => family.members.length > 0);
  const otherTypes = others.map(ref => take(ref)).filter((item): item is Category => Boolean(item));
  return { families: resolvedFamilies, others: otherTypes, unplaced: types.filter(type => !placed.has(type.id)), slots };
}

/** The family an item type is shown in, if any. */
export function familyOf(composition: Composition, categoryId: string): ResolvedFamily | undefined {
  return composition.families.find(family => family.members.some(member => member.id === categoryId));
}

export function landingFamily(composition: Composition, slug: string): ResolvedFamily | undefined {
  return composition.families.find(family => family.landing && family.config.id === slug);
}

/** Published examples across a set of item types, in member order. */
export function familyExamples(members: Category[], products: Product[]): Product[] {
  return members.flatMap(member => products.filter(product => product.categoryId === member.id && product.isPublished).sort((a, b) => a.order - b.order));
}

/**
 * True when two names start with the same word stem ("დიპლომის ყდა" / "დიპლომის ყდები").
 * Used to avoid printing the same name twice on a card.
 */
export function sameStem(a: string, b: string): boolean {
  const stem = (value: string) => value.trim().toLocaleLowerCase().split(/\s+/)[0]?.slice(0, 5) || "";
  return stem(a) === stem(b);
}
