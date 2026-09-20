import "server-only";
import { cache } from "react";
import { getCatalogSnapshot } from "./data";

export const findPublicProduct = cache(async (slug: string) => {
  const catalog = await getCatalogSnapshot();
  const product = catalog.products.find(product => product.isPublished && (product.code === slug || product.slug === slug || product.legacySlugs?.includes(slug)));
  if (!product) return null;
  const category = catalog.categories.find(category => category.id === product.categoryId && category.isActive);
  const group = catalog.groups.find(group => group.id === category?.groupId && group.isActive);
  if (!category || !group) return null;
  return { product, category, group, groups: catalog.groups.filter(group => group.isActive) };
});
