import type { CatalogAttribute, Category, Group, Locale, OptionalLocalizedText, Product, TypeIllustration } from "./types";

export function localized(text: OptionalLocalizedText | undefined, locale: Locale): string {
  return text?.[locale] || text?.ka || "";
}

export function typePath(locale: string, category: Pick<Category, "slug">): string {
  return `/${locale === "en" ? "en" : "ka"}/catalog/types/${encodeURIComponent(category.slug)}`;
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

export const typeIllustrations: TypeIllustration[] = ["cover", "menu", "notebook", "holder", "box", "print"];

// These fields are optional so existing records and photo-created drafts remain valid.
export function parseAttributes(raw: string | undefined): CatalogAttribute[] | undefined {
  if (raw === undefined) return undefined;
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 24) throw new Error("Invalid attributes");
  const text = (input: unknown, required: boolean): string => {
    if (typeof input !== "string" || input.trim().length > 500 || (required && !input.trim())) throw new Error("Invalid attribute text");
    return input.trim();
  };
  return value.map(row => {
    if (!row || typeof row !== "object") throw new Error("Invalid attribute");
    return {
      label: { ka: text(row.label?.ka, true), en: row.label?.en ? text(row.label.en, false) : undefined },
      value: { ka: text(row.value?.ka, true), en: row.value?.en ? text(row.value.en, false) : undefined },
    };
  });
}

export function illustrationFor(category: Category): TypeIllustration {
  if (category.illustration) return category.illustration;
  const label = `${category.slug} ${category.name.ka}`.toLowerCase();
  if (/notebook|diary|ბლოკნოტ|ყოველდღიურ/.test(label)) return "notebook";
  if (/menu|მენიუ/.test(label)) return "menu";
  if (/medal|medlis|მედლ|ყუთ/.test(label)) return "box";
  if (/holder|receipt|საქაღალდე|საბუთების ჩასადები/.test(label)) return "holder";
  return "cover";
}
