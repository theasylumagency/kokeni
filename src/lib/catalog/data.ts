import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { RESERVED_CATALOG_SLUGS, asciiSlug, nextProductCode } from "./urls";
import { parseAttributes, typeIllustrations } from "./typeCatalog";
import type { CatalogAttribute, OrderTerms, TypeIllustration } from "./types";
import { withFileLock, writeJsonAtomic } from "./storage";
import { unstable_noStore as noStore } from "next/cache";

import type {
  Category,
  Group,
  HomeDirectionGroup,
  Locale,
  OptionalLocalizedText,
  Product,
  ProductImage,
  ProductPrice,
} from "@/lib/catalog/types";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const GROUPS_FILE = path.join(DATA_DIRECTORY, "groups.json");
const CATEGORIES_FILE = path.join(DATA_DIRECTORY, "categories.json");
const PRODUCTS_FILE = path.join(DATA_DIRECTORY, "products.json");
const PRODUCT_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export class CatalogMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "CatalogMutationError";
  }
}

type GroupCreateInput = {
  nameKa: string;
  nameEn?: string;
  isActive: boolean;
};

type GroupUpdateInput = GroupCreateInput & {
  id: string;
  order: number;
};

type CategoryCreateInput = {
  groupId: string;
  nameKa: string;
  nameEn?: string;
  isActive: boolean;
  showOnHome: boolean;
  descriptionKa?: string;
  descriptionEn?: string;
  customizationJson?: string;
  relatedCategoryIds?: string[];
  coverProductId?: string;
  illustration?: string;
  catalogOrder?: string;
  orderMinQuantity?: string;
  orderLeadMin?: string;
  orderLeadMax?: string;
  orderPriceFrom?: string;
  orderNoteKa?: string;
  orderNoteEn?: string;
  faqJson?: string;
};

type CategoryUpdateInput = CategoryCreateInput & {
  id: string;
  order: number;
};

type ProductCreateInput = {
  categoryId: string;
  nameKa: string;
  nameEn?: string;
  shortDescriptionKa: string;
  shortDescriptionEn?: string;
  longDescriptionKa?: string;
  longDescriptionEn?: string;
  priceMode: "contact" | "fixed";
  priceAmount?: number;
  isPublished: boolean;
  imagesJson: string;
  originalImagesJson?: string;
  specificationsJson?: string;
};

type ProductUpdateInput = ProductCreateInput & {
  id: string;
  order: number;
};

type CatalogSnapshot = {
  groups: Group[];
  categories: Category[];
  products: Product[];
};

export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  return readCatalogSnapshot();
}

export async function getAdminCatalogSnapshot(): Promise<CatalogSnapshot> {
  return readCatalogSnapshot();
}

export async function getHomeDirections(
  locale: Locale
): Promise<HomeDirectionGroup[]> {
  const { groups, categories } = await readCatalogSnapshot();

  return groups
    .filter((group) => group.isActive)
    .map((group) => ({
      id: group.id,
      order: group.order,
      orderLabel: String(group.order).padStart(2, "0"),
      name: getLocalizedValue(group.name, locale),
      categories: categories
        .filter((category) => category.groupId === group.id && category.isActive && category.showOnHome)
        .sort((left, right) => left.order - right.order)
        .map((category) => ({
          id: category.id,
          slug: category.slug,
          name: getLocalizedValue(category.name, locale),
        })),
    }))
    .filter((group) => group.categories.length > 0)
    .slice(0, 3);
}

async function createGroupRecordUnlocked(input: GroupCreateInput): Promise<void> {
  const groups = await readGroups();
  const now = new Date().toISOString();
  const slug = makeUniqueSlug(
    input.nameEn || input.nameKa,
    groups.map((group) => group.slug)
  );

  groups.push({
    id: randomUUID(),
    slug,
    order: groups.length + 1,
    name: {
      ka: input.nameKa,
      en: input.nameEn || undefined,
    },
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  });

  await writeGroups(groups);
}

async function updateGroupRecordUnlocked(input: GroupUpdateInput): Promise<void> {
  const groups = await readGroups();
  const existingGroup = groups.find((group) => group.id === input.id);

  if (!existingGroup) {
    throw new CatalogMutationError("group_not_found", "ჯგუფი ვერ მოიძებნა.");
  }

  const remainingGroups = groups.filter((group) => group.id !== input.id);
  const slug = makeUniqueSlug(
    input.nameEn || input.nameKa,
    remainingGroups.map((group) => group.slug),
    existingGroup.slug
  );

  const updatedGroup: Group = {
    ...existingGroup,
    slug,
    name: {
      ka: input.nameKa,
      en: input.nameEn || undefined,
    },
    isActive: input.isActive,
    updatedAt: new Date().toISOString(),
  };

  await writeGroups(insertIntoOrderedList(remainingGroups, updatedGroup, input.order));
}

async function deleteGroupRecordUnlocked(id: string): Promise<void> {
  const [groups, categories] = await Promise.all([readGroups(), readCategories()]);

  if (categories.some((category) => category.groupId === id)) {
    throw new CatalogMutationError(
      "group_has_categories",
      "ჯგუფის წაშლამდე მასში არსებული კატეგორიები უნდა წაიშალოს ან სხვა ჯგუფში გადავიდეს."
    );
  }

  const remainingGroups = groups.filter((group) => group.id !== id);

  if (remainingGroups.length === groups.length) {
    throw new CatalogMutationError("group_not_found", "ჯგუფი ვერ მოიძებნა.");
  }

  await writeGroups(remainingGroups);
}

async function createCategoryRecordUnlocked(
  input: CategoryCreateInput
): Promise<void> {
  const [groups, categories] = await Promise.all([readGroups(), readCategories()]);

  if (!groups.some((group) => group.id === input.groupId)) {
    throw new CatalogMutationError("group_not_found", "ჯგუფი ვერ მოიძებნა.");
  }

  if (input.showOnHome) {
    const featuredCount = categories.filter(c => c.groupId === input.groupId && c.showOnHome).length;
    if (featuredCount >= 3) {
      throw new CatalogMutationError("too_many_home_categories", "მთავარ გვერდზე საჩვენებლად დაშვებულია მხოლოდ 3 კატეგორია ერთ ჯგუფში.");
    }
  }

  const now = new Date().toISOString();
  const slug = makeUniqueSlug(
    input.nameEn || input.nameKa,
    [...categories.map((category) => category.slug), ...RESERVED_CATALOG_SLUGS]
  );
  const groupCategories = categories.filter(
    (category) => category.groupId === input.groupId
  );

  categories.push({
    id: randomUUID(),
    groupId: input.groupId,
    slug,
    order: groupCategories.length + 1,
    name: {
      ka: input.nameKa,
      en: input.nameEn || undefined,
    },
    isActive: input.isActive,
    showOnHome: input.showOnHome,
    ...await categoryDetails(input, categories),
    createdAt: now,
    updatedAt: now,
  });

  await writeCategories(categories);
}

async function updateCategoryRecordUnlocked(
  input: CategoryUpdateInput
): Promise<void> {
  const [groups, categories] = await Promise.all([readGroups(), readCategories()]);

  if (!groups.some((group) => group.id === input.groupId)) {
    throw new CatalogMutationError("group_not_found", "ჯგუფი ვერ მოიძებნა.");
  }

  const existingCategory = categories.find((category) => category.id === input.id);

  if (!existingCategory) {
    throw new CatalogMutationError("category_not_found", "კატეგორია ვერ მოიძებნა.");
  }

  if (input.showOnHome) {
    const featuredCount = categories.filter(c => c.groupId === input.groupId && c.showOnHome && c.id !== input.id).length;
    if (featuredCount >= 3) {
      throw new CatalogMutationError("too_many_home_categories", "მთავარ გვერდზე საჩვენებლად დაშვებულია მხოლოდ 3 კატეგორია ერთ ჯგუფში.");
    }
  }

  const remainingCategories = categories.filter(
    (category) => category.id !== input.id
  );
  const slug = makeUniqueSlug(
    input.nameEn || input.nameKa,
    [...remainingCategories.map((category) => category.slug), ...RESERVED_CATALOG_SLUGS],
    RESERVED_CATALOG_SLUGS.includes(existingCategory.slug) ? undefined : existingCategory.slug
  );

  const updatedCategory: Category = {
    ...existingCategory,
    groupId: input.groupId,
    slug,
    name: {
      ka: input.nameKa,
      en: input.nameEn || undefined,
    },
    isActive: input.isActive,
    showOnHome: input.showOnHome,
    ...await categoryDetails(input, categories, existingCategory),
    updatedAt: new Date().toISOString(),
  };

  if (existingCategory.groupId === input.groupId) {
    const sameGroupCategories = remainingCategories.filter(
      (category) => category.groupId === input.groupId
    );
    const otherCategories = remainingCategories.filter(
      (category) => category.groupId !== input.groupId
    );

    await writeCategories([
      ...otherCategories,
      ...insertIntoOrderedList(sameGroupCategories, updatedCategory, input.order),
    ]);
    return;
  }

  const previousGroupCategories = normalizeOrderedList(
    remainingCategories.filter(
      (category) => category.groupId === existingCategory.groupId
    )
  );
  const nextGroupCategories = insertIntoOrderedList(
    remainingCategories.filter((category) => category.groupId === input.groupId),
    updatedCategory,
    input.order
  );
  const untouchedCategories = remainingCategories.filter(
    (category) =>
      category.groupId !== existingCategory.groupId &&
      category.groupId !== input.groupId
  );

  await writeCategories([
    ...untouchedCategories,
    ...previousGroupCategories,
    ...nextGroupCategories,
  ]);
}

async function deleteCategoryRecordUnlocked(id: string): Promise<void> {
  const [categories, products] = await Promise.all([
    readCategories(),
    readProducts(),
  ]);

  if (products.some((product) => product.categoryId === id)) {
    throw new CatalogMutationError(
      "category_has_products",
      "კატეგორიის წაშლამდე მასში არსებული პროდუქტები უნდა წაიშალოს ან გადატანილ იქნას."
    );
  }

  const categoryToDelete = categories.find((category) => category.id === id);

  if (!categoryToDelete) {
    throw new CatalogMutationError("category_not_found", "კატეგორია ვერ მოიძებნა.");
  }

  const remainingCategories = categories.filter((category) => category.id !== id);
  const sameGroupCategories = normalizeOrderedList(
    remainingCategories.filter(
      (category) => category.groupId === categoryToDelete.groupId
    )
  );
  const untouchedCategories = remainingCategories.filter(
    (category) => category.groupId !== categoryToDelete.groupId
  );

  await writeCategories([...untouchedCategories, ...sameGroupCategories]);
}

async function createProductRecordUnlocked(
  input: ProductCreateInput
): Promise<Product> {
  const [categories, products] = await Promise.all([
    readCategories(),
    readProducts(),
  ]);

  if (!categories.some((category) => category.id === input.categoryId)) {
    throw new CatalogMutationError("category_not_found", "კატეგორია ვერ მოიძებნა.");
  }

  const now = new Date().toISOString();
  const category = categories.find((item) => item.id === input.categoryId)!;
  const reserved = await readReservedCodes();
  const slug = nextProductCode(category, products, reserved);
  await writeJsonAtomic(path.join(DATA_DIRECTORY, "product-codes.json"), [...reserved, slug]);

  let images: ProductImage[] = [];
  try {
    images = JSON.parse(input.imagesJson) as ProductImage[];
  } catch (e) {
    throw new CatalogMutationError("invalid_images", "ფოტოების სია არასწორია.");
  }

  let originalImages: ProductImage[] | undefined = undefined;
  if (input.originalImagesJson) {
    try {
      originalImages = JSON.parse(input.originalImagesJson) as ProductImage[];
    } catch (e) {
      throw new CatalogMutationError("invalid_images", "ორიგინალი ფოტოების სია არასწორია.");
    }
  }

  const categoryProducts = products.filter(
    (product) => product.categoryId === input.categoryId
  );

  products.push({
    id: randomUUID(),
    slug,
    code: slug,
    categoryId: input.categoryId,
    order: categoryProducts.length + 1,
    name: {
      ka: input.nameKa,
      en: input.nameEn || undefined,
    },
    shortDescription: {
      ka: input.shortDescriptionKa,
      en: input.shortDescriptionEn || undefined,
    },
    longDescription: buildOptionalLocalizedText(
      input.longDescriptionKa,
      input.longDescriptionEn
    ),
    price: buildPrice(input.priceMode, input.priceAmount),
    images,
    originalImages,
    specifications: validatedAttributes(input.specificationsJson),
    isPublished: input.isPublished,
    createdAt: now,
    updatedAt: now,
  });

  await writeProducts(products);
  return products[products.length - 1];
}

async function updateProductRecordUnlocked(
  input: ProductUpdateInput
): Promise<void> {
  const [categories, products] = await Promise.all([
    readCategories(),
    readProducts(),
  ]);

  if (!categories.some((category) => category.id === input.categoryId)) {
    throw new CatalogMutationError("category_not_found", "კატეგორია ვერ მოიძებნა.");
  }

  const existingProduct = products.find((product) => product.id === input.id);

  if (!existingProduct) {
    throw new CatalogMutationError("product_not_found", "პროდუქტი ვერ მოიძებნა.");
  }

  const remainingProducts = products.filter((product) => product.id !== input.id);
  const slug = existingProduct.code || existingProduct.slug;

  let updatedImages: ProductImage[] = [];
  try {
    updatedImages = JSON.parse(input.imagesJson) as ProductImage[];
  } catch (e) {
    throw new CatalogMutationError("invalid_images", "ფოტოების სია არასწორია.");
  }
  const images = normalizeOrderedList(updatedImages);

  let updatedOriginalImages = existingProduct.originalImages;
  if (input.originalImagesJson) {
    try {
      updatedOriginalImages = JSON.parse(input.originalImagesJson) as ProductImage[];
      updatedOriginalImages = normalizeOrderedList(updatedOriginalImages);
    } catch (e) {
      throw new CatalogMutationError("invalid_images", "ორიგინალი ფოტოების სია არასწორია.");
    }
  }

  const updatedProduct: Product = {
    ...existingProduct,
    slug,
    categoryId: input.categoryId,
    name: {
      ka: input.nameKa,
      en: input.nameEn || undefined,
    },
    shortDescription: {
      ka: input.shortDescriptionKa,
      en: input.shortDescriptionEn || undefined,
    },
    longDescription: buildOptionalLocalizedText(
      input.longDescriptionKa,
      input.longDescriptionEn
    ),
    price: buildPrice(input.priceMode, input.priceAmount),
    images,
    originalImages: updatedOriginalImages,
    specifications: validatedAttributes(input.specificationsJson) ?? existingProduct.specifications,
    isPublished: input.isPublished,
    updatedAt: new Date().toISOString(),
  };

  if (existingProduct.categoryId === input.categoryId) {
    const sameCategoryProducts = remainingProducts.filter(
      (product) => product.categoryId === input.categoryId
    );
    const untouchedProducts = remainingProducts.filter(
      (product) => product.categoryId !== input.categoryId
    );

    await writeProducts([
      ...untouchedProducts,
      ...insertIntoOrderedList(sameCategoryProducts, updatedProduct, input.order),
    ]);
    return;
  }

  const previousCategoryProducts = normalizeOrderedList(
    remainingProducts.filter(
      (product) => product.categoryId === existingProduct.categoryId
    )
  );
  const nextCategoryProducts = insertIntoOrderedList(
    remainingProducts.filter((product) => product.categoryId === input.categoryId),
    updatedProduct,
    input.order
  );
  const untouchedProducts = remainingProducts.filter(
    (product) =>
      product.categoryId !== existingProduct.categoryId &&
      product.categoryId !== input.categoryId
  );

  await writeProducts([
    ...untouchedProducts,
    ...previousCategoryProducts,
    ...nextCategoryProducts,
  ]);
}

async function deleteProductRecordUnlocked(id: string): Promise<void> {
  const products = await readProducts();
  const productToDelete = products.find((product) => product.id === id);

  if (!productToDelete) {
    throw new CatalogMutationError("product_not_found", "პროდუქტი ვერ მოიძებნა.");
  }

  const remainingProducts = products.filter((product) => product.id !== id);
  const sameCategoryProducts = normalizeOrderedList(
    remainingProducts.filter(
      (product) => product.categoryId === productToDelete.categoryId
    )
  );
  const untouchedProducts = remainingProducts.filter(
    (product) => product.categoryId !== productToDelete.categoryId
  );

  await writeProducts([...untouchedProducts, ...sameCategoryProducts]);
}

async function toggleProductPublishedRecordUnlocked(id: string, isPublished: boolean): Promise<void> {
  const products = await readProducts();
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    throw new CatalogMutationError("product_not_found", "პროდუქტი ვერ მოიძებნა.");
  }

  products[productIndex] = {
    ...products[productIndex],
    isPublished,
    updatedAt: new Date().toISOString(),
  };

  await writeProducts(products);
}

export function getLocalizedValue(
  value: { ka?: string; en?: string } | undefined,
  locale: Locale
): string {
  if (!value) {
    return "";
  }

  return value[locale] || value.ka || value.en || "";
}

async function readCatalogSnapshot(): Promise<CatalogSnapshot> {
  await ensureCatalogUrls();
  const [groups, categories, products] = await Promise.all([
    readGroups(),
    readCategories(),
    readProducts(),
  ]);

  return {
    groups: sortGroups(groups),
    categories: sortCategories(categories),
    products: sortProducts(products),
  };
}

async function readGroups(): Promise<Group[]> {
  await ensureStorage();
  const raw = await fs.readFile(GROUPS_FILE, "utf8");
  const parsed = JSON.parse(raw) as Group[];

  return Array.isArray(parsed) ? sortGroups(parsed) : [];
}

async function readCategories(): Promise<Category[]> {
  await ensureStorage();
  const raw = await fs.readFile(CATEGORIES_FILE, "utf8");
  const parsed = JSON.parse(raw) as Category[];

  return Array.isArray(parsed) ? sortCategories(parsed) : [];
}

async function readProducts(): Promise<Product[]> {
  await ensureStorage();
  const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
  const parsed = JSON.parse(raw) as Product[];

  return Array.isArray(parsed) ? sortProducts(parsed) : [];
}

async function writeGroups(groups: Group[]): Promise<void> {
  await ensureStorage();
  await writeJsonAtomic(GROUPS_FILE, sortGroups(normalizeOrderedList(groups)));
}

async function writeCategories(categories: Category[]): Promise<void> {
  await ensureStorage();
  await writeJsonAtomic(CATEGORIES_FILE, sortCategories(normalizeNestedList(categories, (item) => item.groupId)));
}

async function writeProducts(products: Product[]): Promise<void> {
  await ensureStorage();
  await writeJsonAtomic(PRODUCTS_FILE, sortProducts(normalizeNestedList(products, (item) => item.categoryId)));
}

async function ensureStorage(): Promise<void> {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  await fs.mkdir(PRODUCT_UPLOAD_DIRECTORY, { recursive: true });
  await ensureFile(GROUPS_FILE);
  await ensureFile(CATEGORIES_FILE);
  await ensureFile(PRODUCTS_FILE);
}

async function ensureFile(filePath: string): Promise<void> {
  try {
    await fs.writeFile(filePath, "[]\n", { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}

function sortGroups(groups: Group[]): Group[] {
  return [...groups].sort((left, right) => left.order - right.order);
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => {
    if (left.groupId !== right.groupId) {
      return left.groupId.localeCompare(right.groupId);
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.ka.localeCompare(right.name.ka, "ka");
  });
}

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((left, right) => {
    if (left.categoryId !== right.categoryId) {
      return left.categoryId.localeCompare(right.categoryId);
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.ka.localeCompare(right.name.ka, "ka");
  });
}

function normalizeOrderedList<T extends { order: number }>(items: T[]): T[] {
  return [...items]
    .sort((left, right) => left.order - right.order)
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));
}

function normalizeNestedList<T extends { order: number }>(
  items: T[],
  getParentId: (item: T) => string
): T[] {
  const bucketMap = new Map<string, T[]>();

  for (const item of items) {
    const parentId = getParentId(item);
    const bucket = bucketMap.get(parentId) ?? [];
    bucket.push(item);
    bucketMap.set(parentId, bucket);
  }

  return Array.from(bucketMap.keys())
    .sort()
    .flatMap((parentId) => normalizeOrderedList(bucketMap.get(parentId) ?? []));
}

function insertIntoOrderedList<T extends { order: number }>(
  items: T[],
  item: T,
  desiredOrder: number
): T[] {
  const orderedItems = [...items].sort((left, right) => left.order - right.order);
  const safeOrder = Math.min(
    Math.max(Number.isFinite(desiredOrder) ? desiredOrder : orderedItems.length + 1, 1),
    orderedItems.length + 1
  );

  orderedItems.splice(safeOrder - 1, 0, item);

  return orderedItems.map((entry, index) => ({
    ...entry,
    order: index + 1,
  }));
}

function makeUniqueSlug(
  source: string,
  takenSlugs: string[],
  currentSlug?: string
): string {
  const baseSlug = slugify(source) || `item-${randomUUID().slice(0, 8)}`;
  let candidate = currentSlug && /^[a-z0-9-]+$/.test(currentSlug) ? currentSlug : baseSlug;
  let counter = 2;

  while (takenSlugs.includes(candidate) && candidate !== currentSlug) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function slugify(source: string): string { return asciiSlug(source); }

function buildOptionalLocalizedText(
  ka?: string,
  en?: string
): OptionalLocalizedText | undefined {
  const value: OptionalLocalizedText = {};

  if (ka) {
    value.ka = ka;
  }

  if (en) {
    value.en = en;
  }

  return Object.keys(value).length > 0 ? value : undefined;
}

function buildPrice(
  mode: "contact" | "fixed",
  amount?: number
): ProductPrice {
  if (mode === "contact") {
    return { mode: "contact" };
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount < 0) {
    throw new CatalogMutationError(
      "invalid_price",
      "ფასის მითითებისას აუცილებელია სწორი რიცხვითი მნიშვნელობა."
    );
  }

  return {
    mode: "fixed",
    amount,
    currency: "GEL",
  };
}

async function persistUploadedImages(
  imageFiles: File[],
  orderOffset = 0
): Promise<ProductImage[]> {
  await ensureStorage();

  const validFiles = imageFiles.filter((file) => file.size > 0);
  const uploadedImages: ProductImage[] = [];

  for (const [index, imageFile] of validFiles.entries()) {
    if (!ACCEPTED_IMAGE_TYPES.has(imageFile.type)) {
      throw new CatalogMutationError(
        "invalid_image_type",
        "დასაშვებია მხოლოდ JPG, PNG და WEBP ფაილები."
      );
    }

    const extension = resolveImageExtension(imageFile);
    const fileName = `${randomUUID()}${extension}`;
    const filePath = path.join(PRODUCT_UPLOAD_DIRECTORY, fileName);
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    uploadedImages.push({
      id: randomUUID(),
      src: `/uploads/products/${fileName}`,
      order: orderOffset + index + 1,
    });
  }

  return uploadedImages;
}

async function deleteImages(images: ProductImage[]): Promise<void> {
  await Promise.all(
    images.map(async (image) => {
      const imagePath = path.join(
        PRODUCT_UPLOAD_DIRECTORY,
        path.basename(image.src)
      );

      try {
        await fs.unlink(imagePath);
      } catch {
        // Ignore missing files so JSON remains the source of truth.
      }
    })
  );
}

function resolveImageExtension(file: File): string {
  const explicitExtension = path.extname(file.name).toLowerCase();

  if (explicitExtension) {
    return explicitExtension;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/jpeg":
    case "image/jpg":
    default:
      return ".jpg";
  }
}

export async function createGroupRecord(...args: Parameters<typeof createGroupRecordUnlocked>): Promise<Awaited<ReturnType<typeof createGroupRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => createGroupRecordUnlocked(...args));
}
export async function updateGroupRecord(...args: Parameters<typeof updateGroupRecordUnlocked>): Promise<Awaited<ReturnType<typeof updateGroupRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => updateGroupRecordUnlocked(...args));
}
export async function deleteGroupRecord(...args: Parameters<typeof deleteGroupRecordUnlocked>): Promise<Awaited<ReturnType<typeof deleteGroupRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => deleteGroupRecordUnlocked(...args));
}
export async function createCategoryRecord(...args: Parameters<typeof createCategoryRecordUnlocked>): Promise<Awaited<ReturnType<typeof createCategoryRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => createCategoryRecordUnlocked(...args));
}
export async function updateCategoryRecord(...args: Parameters<typeof updateCategoryRecordUnlocked>): Promise<Awaited<ReturnType<typeof updateCategoryRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => updateCategoryRecordUnlocked(...args));
}
export async function deleteCategoryRecord(...args: Parameters<typeof deleteCategoryRecordUnlocked>): Promise<Awaited<ReturnType<typeof deleteCategoryRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => deleteCategoryRecordUnlocked(...args));
}
export async function createProductRecord(...args: Parameters<typeof createProductRecordUnlocked>): Promise<Awaited<ReturnType<typeof createProductRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => createProductRecordUnlocked(...args));
}
export async function updateProductRecord(...args: Parameters<typeof updateProductRecordUnlocked>): Promise<Awaited<ReturnType<typeof updateProductRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => updateProductRecordUnlocked(...args));
}
export async function deleteProductRecord(...args: Parameters<typeof deleteProductRecordUnlocked>): Promise<Awaited<ReturnType<typeof deleteProductRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => deleteProductRecordUnlocked(...args));
}
export async function toggleProductPublishedRecord(...args: Parameters<typeof toggleProductPublishedRecordUnlocked>): Promise<Awaited<ReturnType<typeof toggleProductPublishedRecordUnlocked>>> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, () => toggleProductPublishedRecordUnlocked(...args));
}
async function readReservedCodes(): Promise<string[]> {
  try { return JSON.parse(await fs.readFile(path.join(DATA_DIRECTORY, "product-codes.json"), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}

export async function ensureCatalogUrls(): Promise<void> {
  await ensureStorage();
  await withFileLock(PRODUCTS_FILE, async () => {
    const [groups, categories, products] = await Promise.all([readGroups(), readCategories(), readProducts()]);
    const originals = JSON.stringify({ groups, categories, products });
    for (const list of [groups, categories]) {
      const taken = new Set(list.filter(item => /^[a-z0-9-]+$/.test(item.slug)).map(item => item.slug));
      for (const item of list) {
        if (/^[a-z0-9-]+$/.test(item.slug)) continue;
        const base = asciiSlug(item.name.en || item.slug) || 'item';
        let slug = base; let suffix = 2;
        while (taken.has(slug)) slug = base + '-' + suffix++;
        item.legacySlugs = [...new Set([...(item.legacySlugs || []), item.slug])];
        item.slug = slug; taken.add(slug);
      }
    }
    const reserved = await readReservedCodes();
    for (const product of [...products].sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))) {
      if (product.code && /^kkn-[a-z0-9]+-[0-9]+$/.test(product.code)) continue;
      const category = categories.find(item => item.id === product.categoryId);
      if (!category) throw new Error('Product category missing during URL migration');
      const code = nextProductCode(category, products, reserved);
      product.legacySlugs = [...new Set([...(product.legacySlugs || []), product.slug])];
      product.code = code; product.slug = code; reserved.push(code);
    }
    const allReserved = [...new Set([...reserved, ...products.map(product => product.code!)])];
    if (JSON.stringify(allReserved) !== JSON.stringify(await readReservedCodes())) {
      await writeJsonAtomic(path.join(DATA_DIRECTORY, 'product-codes.json'), allReserved);
    }
    if (originals !== JSON.stringify({ groups, categories, products })) {
      const backup = path.join(DATA_DIRECTORY, 'backups', 'before-product-url-migration.json');
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await fs.writeFile(backup, originals, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
      await writeGroups(groups); await writeCategories(categories); await writeProducts(products);
    }
  });
}

export async function saveWorkflowGallery(productId: string, images: ProductImage[], mode: 'append' | 'replace', expectedUpdatedAt: string): Promise<Product> {
  await ensureCatalogUrls();
  return withFileLock(PRODUCTS_FILE, async () => {
    const products = await readProducts();
    const product = products.find(item => item.id === productId);
    if (!product) throw new CatalogMutationError('product_not_found', 'პროდუქტი ვერ მოიძებნა.');
    if (product.updatedAt !== expectedUpdatedAt) throw new CatalogMutationError('conflict', 'პროდუქტი სხვა ფანჯარაში შეიცვალა. განაახლეთ გვერდი.');
    // A retried save must not duplicate already committed assets.
    const incoming = new Set(images.map(image => image.id));
    const retained = product.images.filter(image => !incoming.has(image.id));
    const combined = mode === 'replace' ? images : [...retained, ...images.map(image => ({ ...image, role: image.role === 'main' && retained.length ? 'additional' as const : image.role }))];
    product.images = combined.map((image, index) => ({ ...image, order: index + 1 }));
    product.updatedAt = new Date().toISOString();
    await writeProducts(products);
    return product;
  });
}

function validatedAttributes(raw: string | undefined): CatalogAttribute[] | undefined {
  try { return parseAttributes(raw); }
  catch { throw new CatalogMutationError("invalid_attributes", "მახასიათებელს სჭირდება ქართული დასახელება და მნიშვნელობა (მაქსიმუმ 24 ჩანაწერი, თითო ველი 500 სიმბოლომდე)."); }
}

function parseOrderTerms(input: CategoryCreateInput): OrderTerms | undefined {
  const integer = (raw: string | undefined): number | undefined => {
    const text = raw?.trim();
    if (!text) return undefined;
    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < 1 || value > 1_000_000) {
      throw new CatalogMutationError("invalid_order_terms", "რაოდენობა და ვადა უნდა იყოს დადებითი მთელი რიცხვი.");
    }
    return value;
  };
  const minQuantity = integer(input.orderMinQuantity);
  const leadMin = integer(input.orderLeadMin);
  const leadMax = integer(input.orderLeadMax);
  if (leadMax !== undefined && leadMin === undefined) {
    throw new CatalogMutationError("invalid_order_terms", "ვადის „მაქსიმუმი“ მხოლოდ „მინიმუმთან“ ერთად მიუთითეთ.");
  }
  if (leadMin !== undefined && leadMax !== undefined && leadMax < leadMin) {
    throw new CatalogMutationError("invalid_order_terms", "ვადის მაქსიმუმი მინიმუმზე ნაკლები ვერ იქნება.");
  }
  const priceText = input.orderPriceFrom?.trim().replace(",", ".");
  const priceFrom = priceText ? Number(priceText) : undefined;
  if (priceFrom !== undefined && (!Number.isFinite(priceFrom) || priceFrom <= 0 || priceFrom > 1_000_000)) {
    throw new CatalogMutationError("invalid_order_terms", "ფასი უნდა იყოს დადებითი რიცხვი ან დატოვეთ ცარიელი.");
  }
  const terms: OrderTerms = {
    ...(minQuantity !== undefined ? { minQuantity } : {}),
    ...(leadMin !== undefined ? { leadTimeDays: { min: leadMin, ...(leadMax !== undefined && leadMax !== leadMin ? { max: leadMax } : {}) } } : {}),
    ...(priceFrom !== undefined ? { priceFrom: Math.round(priceFrom * 100) / 100 } : {}),
  };
  const note = buildOptionalLocalizedText(input.orderNoteKa?.slice(0, 500), input.orderNoteEn?.slice(0, 500));
  if (note) terms.note = note;
  return Object.keys(terms).length ? terms : undefined;
}

async function categoryDetails(input: CategoryCreateInput, categories: Category[], existing?: Category): Promise<Partial<Category>> {
  const details: Partial<Category> = {};
  if (input.catalogOrder !== undefined) {
    const order = input.catalogOrder.trim() ? Number(input.catalogOrder) : undefined;
    if (order !== undefined && (!Number.isSafeInteger(order) || order < 1)) throw new CatalogMutationError("invalid_order", "მიუთითეთ დადებითი მთელი რიცხვი.");
    details.catalogOrder = order;
  }
  if (input.descriptionKa !== undefined || input.descriptionEn !== undefined) {
    details.description = buildOptionalLocalizedText(input.descriptionKa, input.descriptionEn);
  }
  if (input.customizationJson !== undefined) details.customization = validatedAttributes(input.customizationJson);
  if (input.faqJson !== undefined) {
    try { details.faq = parseAttributes(input.faqJson, 2000); }
    catch { throw new CatalogMutationError("invalid_faq", "კითხვას და პასუხს ქართული ტექსტი სჭირდება (მაქსიმუმ 24 კითხვა, პასუხი 2000 სიმბოლომდე)."); }
  }
  if ([input.orderMinQuantity, input.orderLeadMin, input.orderLeadMax, input.orderPriceFrom, input.orderNoteKa, input.orderNoteEn].some(value => value !== undefined)) {
    details.orderTerms = parseOrderTerms(input);
  }
  if (input.relatedCategoryIds !== undefined) {
    const ids = [...new Set(input.relatedCategoryIds)];
    if (ids.length > 24 || ids.some(id => id === existing?.id || !categories.some(category => category.id === id))) {
      throw new CatalogMutationError("invalid_related_types", "აირჩიეთ არსებული, განსხვავებული ნივთის ტიპები.");
    }
    details.relatedCategoryIds = ids;
  }
  if (input.illustration !== undefined) {
    if (!typeIllustrations.includes(input.illustration as TypeIllustration)) throw new CatalogMutationError("invalid_attributes", "აირჩიეთ ილუსტრაცია.");
    details.illustration = input.illustration as TypeIllustration;
  }
  if (input.coverProductId !== undefined) {
    if (input.coverProductId) {
      const products = await readProducts();
      if (!existing || !products.some(product => product.id === input.coverProductId && product.categoryId === existing.id)) {
        throw new CatalogMutationError("invalid_cover_product", "აირჩიეთ ამ ტიპის ნამუშევარი.");
      }
    }
    details.coverProductId = input.coverProductId || undefined;
  }
  return details;
}
