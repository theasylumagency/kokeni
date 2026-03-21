import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
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
          name: getLocalizedValue(category.name, locale),
        })),
    }))
    .filter((group) => group.categories.length > 0)
    .slice(0, 3);
}

export async function createGroupRecord(input: GroupCreateInput): Promise<void> {
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

export async function updateGroupRecord(input: GroupUpdateInput): Promise<void> {
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

export async function deleteGroupRecord(id: string): Promise<void> {
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

export async function createCategoryRecord(
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
    categories.map((category) => category.slug)
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
    createdAt: now,
    updatedAt: now,
  });

  await writeCategories(categories);
}

export async function updateCategoryRecord(
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
    remainingCategories.map((category) => category.slug),
    existingCategory.slug
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

export async function deleteCategoryRecord(id: string): Promise<void> {
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

export async function createProductRecord(
  input: ProductCreateInput
): Promise<void> {
  const [categories, products] = await Promise.all([
    readCategories(),
    readProducts(),
  ]);

  if (!categories.some((category) => category.id === input.categoryId)) {
    throw new CatalogMutationError("category_not_found", "კატეგორია ვერ მოიძებნა.");
  }

  const now = new Date().toISOString();
  const slug = makeUniqueSlug(
    input.nameEn || input.nameKa,
    products.map((product) => product.slug)
  );

  let images: ProductImage[] = [];
  try {
    images = JSON.parse(input.imagesJson) as ProductImage[];
  } catch (e) {
    throw new CatalogMutationError("invalid_images", "ფოტოების სია არასწორია.");
  }
  const categoryProducts = products.filter(
    (product) => product.categoryId === input.categoryId
  );

  products.push({
    id: randomUUID(),
    slug,
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
    isPublished: input.isPublished,
    createdAt: now,
    updatedAt: now,
  });

  await writeProducts(products);
}

export async function updateProductRecord(
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
  const slug = makeUniqueSlug(
    input.nameEn || input.nameKa,
    remainingProducts.map((product) => product.slug),
    existingProduct.slug
  );

  let updatedImages: ProductImage[] = [];
  try {
    updatedImages = JSON.parse(input.imagesJson) as ProductImage[];
  } catch (e) {
    throw new CatalogMutationError("invalid_images", "ფოტოების სია არასწორია.");
  }
  const images = normalizeOrderedList(updatedImages);

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

export async function deleteProductRecord(id: string): Promise<void> {
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

export async function toggleProductPublishedRecord(id: string, isPublished: boolean): Promise<void> {
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
  await fs.writeFile(
    GROUPS_FILE,
    JSON.stringify(sortGroups(normalizeOrderedList(groups)), null, 2) + "\n",
    "utf8"
  );
}

async function writeCategories(categories: Category[]): Promise<void> {
  await ensureStorage();
  await fs.writeFile(
    CATEGORIES_FILE,
    JSON.stringify(sortCategories(normalizeNestedList(categories, (item) => item.groupId)), null, 2) +
      "\n",
    "utf8"
  );
}

async function writeProducts(products: Product[]): Promise<void> {
  await ensureStorage();
  await fs.writeFile(
    PRODUCTS_FILE,
    JSON.stringify(sortProducts(normalizeNestedList(products, (item) => item.categoryId)), null, 2) +
      "\n",
    "utf8"
  );
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
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]\n", "utf8");
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
  let candidate = currentSlug && currentSlug.startsWith(baseSlug) ? currentSlug : baseSlug;
  let counter = 2;

  while (takenSlugs.includes(candidate) && candidate !== currentSlug) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function slugify(source: string): string {
  return source
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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
