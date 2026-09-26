import type { CatalogAttribute, Category, Group, Locale, OptionalLocalizedText, OrderTerms, Product, TypeIllustration } from "./types";

export function localized(text: OptionalLocalizedText | undefined, locale: Locale): string {
  return text?.[locale] || text?.ka || "";
}

export function typePath(locale: string, category: Pick<Category, "slug">): string {
  return `/${locale === "en" ? "en" : "ka"}/catalog/${encodeURIComponent(category.slug)}`;
}

export function publicTypes(groups: Group[], categories: Category[]): Category[] {
  const activeGroups = new Set(groups.filter(group => group.isActive).map(group => group.id));
  const groupOrder = new Map(groups.map(group => [group.id, group.order]));
  return categories.filter(category => category.isActive && activeGroups.has(category.groupId))
    .sort((a, b) => (a.catalogOrder ?? ((groupOrder.get(a.groupId) || 0) * 1000 + a.order)) - (b.catalogOrder ?? ((groupOrder.get(b.groupId) || 0) * 1000 + b.order)) || a.name.ka.localeCompare(b.name.ka, "ka"));
}

export function typeExamples(category: Category, products: Product[]): Product[] {
  return products.filter(product => product.categoryId === category.id && product.isPublished)
    .sort((a, b) => a.order - b.order);
}

export function typeCover(category: Category, products: Product[]): Product | undefined {
  const examples = typeExamples(category, products);
  return examples.find(product => product.id === category.coverProductId && product.images.length > 0)
    || examples.find(product => product.images.length > 0);
}

/** Drawings offered in the admin, with their Georgian labels (the order of the select). */
export const TYPE_DRAWINGS: { value: TypeIllustration; label: string }[] = [
  { value: "diploma", label: "დიპლომის ყდა" },
  { value: "credential", label: "მოწმობის ყდა (ორფურცლიანი)" },
  { value: "certificate", label: "A4 მოწმობა / სერტიფიკატი ყდაში" },
  { value: "marriage", label: "ქორწინების მოწმობის ყდა" },
  { value: "passport", label: "პასპორტის ყდა" },
  { value: "card", label: "ბარათის ჩასადები (ID)" },
  { value: "menu", label: "მენიუს ყდა" },
  { value: "receipt", label: "ანგარიშის ჩასადები" },
  { value: "waiter", label: "მიმტანის ბლოკნოტი" },
  { value: "notebook", label: "ბლოკნოტი" },
  { value: "diary", label: "ყოველდღიური" },
  { value: "planner", label: "კვირის დამგეგმავი" },
  { value: "folder", label: "საქაღალდე" },
  { value: "binder", label: "ბაინდერი" },
  { value: "box", label: "ყუთი / მედლის ყუთი" },
];

/** Every value a saved record may carry (specific drawings plus the original generic ones). */
export const typeIllustrations: TypeIllustration[] = [...TYPE_DRAWINGS.map(item => item.value), "cover", "holder", "print"];

// These fields are optional so existing records and photo-created drafts remain valid.
export function parseAttributes(raw: string | undefined, maxValueLength = 500): CatalogAttribute[] | undefined {
  if (raw === undefined) return undefined;
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 24) throw new Error("Invalid attributes");
  const text = (input: unknown, required: boolean, max = 500): string => {
    if (typeof input !== "string" || input.trim().length > max || (required && !input.trim())) throw new Error("Invalid attribute text");
    return input.trim();
  };
  return value.map(row => {
    if (!row || typeof row !== "object") throw new Error("Invalid attribute");
    return {
      label: { ka: text(row.label?.ka, true), en: row.label?.en ? text(row.label.en, false) : undefined },
      value: { ka: text(row.value?.ka, true, maxValueLength), en: row.value?.en ? text(row.value.en, false, maxValueLength) : undefined },
    };
  });
}

const LEGACY_DRAWING: Partial<Record<TypeIllustration, TypeIllustration>> = { cover: "diploma", holder: "folder", print: "certificate" };
/** Generic values the old admin saved by default; a more specific drawing detected from the name wins over them. */
const GENERIC_DRAWINGS = new Set<TypeIllustration>(["cover", "holder", "print", "menu", "notebook", "box"]);

const DRAWING_PATTERNS: [TypeIllustration, RegExp][] = [
  ["diploma", /diplom|დიპლომ/],
  ["marriage", /marriage|wedding|ქორწინ/],
  ["certificate", /birth|დაბადებ/],
  ["credential", /credential|motsmob|ofitsial|official|certificate|მოწმობ|ოფიციალ/],
  ["passport", /passport|პასპორტ/],
  ["waiter", /waiter|მიმტან/],
  ["receipt", /receipt|bill|check-presenter|ანგარიშ|ჩეკ/],
  ["menu", /menu|მენიუ/],
  ["planner", /planner|weekly|დამგეგმ|კვირის|პლანერ/],
  ["diary", /diary|ყოველდღიურ|დღიურ/],
  ["notebook", /notebook|journal|ბლოკნოტ|რვეულ/],
  ["binder", /binder|ბაინდერ|რგოლ/],
  ["folder", /folder|document|portfolio|საქაღალდ|საბუთ|ფოლდერ/],
  ["card", /card|badge|ბარათ|პირადობ|ბეიჯ/],
  ["box", /medal|box|case|მედ|ყუთ|კოლოფ/],
];

/**
 * The drawing for an item type. A specific drawing chosen in the admin is used as is; otherwise the
 * name decides (so a diary saved with the old generic "notebook" still gets the diary drawing).
 */
export function illustrationFor(category: Pick<Category, "slug" | "name" | "illustration">): TypeIllustration {
  const saved = category.illustration;
  if (saved && !GENERIC_DRAWINGS.has(saved)) return saved;
  const label = `${category.slug} ${category.name.ka} ${category.name.en || ""}`.toLowerCase();
  const detected = DRAWING_PATTERNS.find(([, pattern]) => pattern.test(label))?.[0];
  return detected || (saved && (LEGACY_DRAWING[saved] || saved)) || "diploma";
}

const money = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(2);

/** "12 ₾-დან / ცალი" — only when the company chose to publish a starting price. */
export function priceFromLabel(terms: OrderTerms | undefined, locale: Locale): string | undefined {
  if (!terms?.priceFrom) return undefined;
  return locale === "en" ? `from ${money(terms.priceFrom)} ₾ per unit` : `${money(terms.priceFrom)} ₾-დან / ცალი`;
}

export function leadTimeLabel(terms: OrderTerms | undefined, locale: Locale): string | undefined {
  const days = terms?.leadTimeDays;
  if (!days) return undefined;
  const range = days.max && days.max !== days.min ? `${days.min}–${days.max}` : String(days.min);
  return locale === "en" ? `${range} working day${range === "1" ? "" : "s"}` : `${range} სამუშაო დღე`;
}

export function minQuantityLabel(terms: OrderTerms | undefined, locale: Locale): string | undefined {
  if (!terms?.minQuantity) return undefined;
  return locale === "en" ? `from ${terms.minQuantity} pcs` : `${terms.minQuantity} ცალიდან`;
}

/** Label/value rows for the public "order terms" block; empty fields are omitted. */
export function orderTermRows(terms: OrderTerms | undefined, locale: Locale): { label: string; value: string }[] {
  const en = locale === "en";
  return [
    { label: en ? "Minimum order" : "მინიმალური რაოდენობა", value: minQuantityLabel(terms, locale) },
    { label: en ? "Production time" : "დამზადების ვადა", value: leadTimeLabel(terms, locale) },
    { label: en ? "Price" : "ფასი", value: priceFromLabel(terms, locale) },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
}

export type FaqItem = { question: string; answer: string };

/**
 * Questions buyers ask about an item type. The first ones are generated from the order terms
 * (so they stay true when terms change); questions written in the admin follow.
 * The type name is set off with a colon so Georgian needs no declension.
 */
export function typeFaq(category: Category, locale: Locale, contact: { phone: string; email: string }): FaqItem[] {
  const en = locale === "en";
  const name = localized(category.name, locale);
  const terms = category.orderTerms;
  const note = localized(terms?.note, locale);
  const items: FaqItem[] = [];
  const min = terms?.minQuantity;
  if (min) items.push(en
    ? { question: `What is the minimum order for ${name}?`, answer: `The minimum order is ${min} pieces. Every piece is made to order, so for other quantities just ask us.` }
    : { question: `${name}: რა არის მინიმალური შეკვეთა?`, answer: `მინიმალური შეკვეთაა ${min} ცალი. ყველა ნივთი ინდივიდუალური შეკვეთით მზადდება, ამიტომ სხვა რაოდენობაზე დაგვიკავშირდით.` });
  const lead = leadTimeLabel(terms, locale);
  if (lead) items.push(en
    ? { question: `How long does it take to make ${name}?`, answer: `Production takes ${lead}. We confirm the exact date once the quantity, format and details are agreed.` }
    : { question: `${name}: რამდენ დღეში მზადდება?`, answer: `დამზადებას სჭირდება ${lead}. ზუსტ თარიღს ვადასტურებთ რაოდენობის, ფორმატისა და დეტალების შეთანხმების შემდეგ.` });
  const price = priceFromLabel(terms, locale);
  items.push(en
    ? { question: `How much does ${name} cost?`, answer: `${price ? `Prices start ${price}. ` : ""}${note ? `${note.replace(/\.?$/, ".")} ` : "The final price depends on quantity, material and finishing. "}We quote the exact price once the details are agreed.` }
    : { question: `${name}: რა ღირს?`, answer: `${price ? `ფასი იწყება ${price}. ` : ""}${note ? `${note.replace(/\.?$/, ".")} ` : "საბოლოო ფასი დამოკიდებულია რაოდენობაზე, მასალასა და დამუშავებაზე. "}ზუსტ ფასს დეტალების შეთანხმების შემდეგ გეტყვით.` });
  items.push(en
    ? { question: `How do I order ${name}?`, answer: `Message us on WhatsApp or Viber (${contact.phone}), call, or write to ${contact.email}. Tell us the quantity, format and when you need it; you can start from one of the completed examples.` }
    : { question: `${name}: როგორ შევუკვეთო?`, answer: `მოგვწერეთ WhatsApp-ით ან Viber-ით (${contact.phone}), დაგვირეკეთ ან მოგვწერეთ ${contact.email}-ზე. მიუთითეთ რაოდენობა, ფორმატი და როდის გჭირდებათ — საწყისად შეგიძლიათ შესრულებული ნამუშევრიდან აირჩიოთ.` });
  for (const row of category.faq || []) {
    const question = localized(row.label, locale).trim();
    const answer = localized(row.value, locale).trim();
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

/** Meta description for an item type: its own description, or one built from its terms. */
export function typeMetaDescription(category: Category, locale: Locale): string {
  const own = localized(category.description, locale);
  if (own) return own;
  const name = localized(category.name, locale);
  const terms = [minQuantityLabel(category.orderTerms, locale), leadTimeLabel(category.orderTerms, locale)].filter(Boolean).join(", ");
  return locale === "en"
    ? `${name}, made to order${terms ? ` (${terms})` : ""}. See completed examples and order from KOKENI, Tbilisi — manufacturing since 1989.`
    : `${name} ინდივიდუალური შეკვეთით${terms ? ` (${terms})` : ""}. ნახეთ შესრულებული ნამუშევრები და შეუკვეთეთ KOKENI-ში, თბილისი — 1989 წლიდან.`;
}
