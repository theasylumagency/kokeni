import type { Category, Product, ProductPhotoKind } from "@/lib/catalog/types";

export const REQUIRED_PHOTO_KINDS = [
  "front_closed",
  "interior_open",
  "detail_spine",
] as const satisfies readonly ProductPhotoKind[];

export function buildSuggestedPhotoProductName(
  category: Category,
  products: Product[]
): string {
  const nextSequence = getNextCategorySequence(category.id, products);
  return `${category.name.ka} ${String(nextSequence).padStart(3, "0")}`;
}

export function getNextCategorySequence(
  categoryId: string,
  products: Product[]
): number {
  const usedNumbers = new Set(
    products
      .filter((product) => product.categoryId === categoryId)
      .map((product) => extractTrailingSequence(product.name.ka))
      .filter((value): value is number => value !== null)
  );

  let candidate = 1;
  while (usedNumbers.has(candidate)) {
    candidate += 1;
  }

  return candidate;
}

function extractTrailingSequence(value: string): number | null {
  const match = value.trim().match(/(\d{3,})$/);

  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
