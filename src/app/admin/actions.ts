"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  CatalogMutationError,
  createCategoryRecord,
  createGroupRecord,
  createProductRecord,
  deleteCategoryRecord,
  deleteGroupRecord,
  deleteProductRecord,
  updateCategoryRecord,
  updateGroupRecord,
  updateProductRecord,
} from "@/lib/catalog/data";
import {
  REQUIRED_PHOTO_KINDS,
} from "@/lib/catalog/photoProduct";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminConfigured,
  requireAdminAuth,
  verifyAdminPassword,
} from "@/lib/admin/auth";

export async function loginAction(formData: FormData): Promise<void> {
  if (!isAdminConfigured()) {
    redirectWithError("config_missing");
  }

  const password = getTextValue(formData, "password");

  if (!password || !verifyAdminPassword(password)) {
    redirectWithError("login_failed");
  }

  await createAdminSession();
  redirectWithStatus("logged_in");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirectWithStatus("logged_out");
}

export async function createGroupAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await createGroupRecord({
      nameKa: getRequiredTextValue(formData, "nameKa"),
      nameEn: getOptionalTextValue(formData, "nameEn"),
      isActive: getCheckboxValue(formData, "isActive"),
    });
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("group_created");
}

export async function updateGroupAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await updateGroupRecord({
      id: getRequiredTextValue(formData, "id"),
      nameKa: getRequiredTextValue(formData, "nameKa"),
      nameEn: getOptionalTextValue(formData, "nameEn"),
      order: getRequiredPositiveInteger(formData, "order"),
      isActive: getCheckboxValue(formData, "isActive"),
    });
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("group_updated");
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await deleteGroupRecord(getRequiredTextValue(formData, "id"));
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("group_deleted");
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await createCategoryRecord({
      groupId: getRequiredTextValue(formData, "groupId"),
      nameKa: getRequiredTextValue(formData, "nameKa"),
      nameEn: getOptionalTextValue(formData, "nameEn"),
      isActive: getCheckboxValue(formData, "isActive"),
      showOnHome: getCheckboxValue(formData, "showOnHome"),
    });
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("category_created");
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await updateCategoryRecord({
      id: getRequiredTextValue(formData, "id"),
      groupId: getRequiredTextValue(formData, "groupId"),
      nameKa: getRequiredTextValue(formData, "nameKa"),
      nameEn: getOptionalTextValue(formData, "nameEn"),
      order: getRequiredPositiveInteger(formData, "order"),
      isActive: getCheckboxValue(formData, "isActive"),
      showOnHome: getCheckboxValue(formData, "showOnHome"),
    });
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("category_updated");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await deleteCategoryRecord(getRequiredTextValue(formData, "id"));
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("category_deleted");
}

export async function createProductAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await createProductRecord({
      categoryId: getRequiredTextValue(formData, "categoryId"),
      nameKa: getRequiredTextValue(formData, "nameKa"),
      nameEn: getOptionalTextValue(formData, "nameEn"),
      shortDescriptionKa: getRequiredTextValue(formData, "shortDescriptionKa"),
      shortDescriptionEn: getOptionalTextValue(formData, "shortDescriptionEn"),
      longDescriptionKa: getOptionalTextValue(formData, "longDescriptionKa"),
      longDescriptionEn: getOptionalTextValue(formData, "longDescriptionEn"),
      priceMode: getPriceMode(formData),
      priceAmount: getOptionalDecimalValue(formData, "priceAmount"),
      isPublished: getCheckboxValue(formData, "isPublished"),
      imagesJson: getRequiredTextValue(formData, "imagesJson"),
    });
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("product_created");
}

export async function createPhotoProductAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    const imagesJson = getRequiredTextValue(formData, "imagesJson");
    assertRequiredPhotoSlots(imagesJson);

    await createProductRecord({
      categoryId: getRequiredTextValue(formData, "categoryId"),
      nameKa: getRequiredTextValue(formData, "nameKa"),
      shortDescriptionKa: getRequiredTextValue(formData, "nameKa"),
      priceMode: "contact",
      isPublished: false,
      imagesJson,
    });
  } catch (error) {
    handleActionError(error, "photo-generation");
  }

  revalidateCatalogPaths();
  redirectWithStatus("photo_product_created", "photo-generation");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await updateProductRecord({
      id: getRequiredTextValue(formData, "id"),
      categoryId: getRequiredTextValue(formData, "categoryId"),
      order: getRequiredPositiveInteger(formData, "order"),
      nameKa: getRequiredTextValue(formData, "nameKa"),
      nameEn: getOptionalTextValue(formData, "nameEn"),
      shortDescriptionKa: getRequiredTextValue(formData, "shortDescriptionKa"),
      shortDescriptionEn: getOptionalTextValue(formData, "shortDescriptionEn"),
      longDescriptionKa: getOptionalTextValue(formData, "longDescriptionKa"),
      longDescriptionEn: getOptionalTextValue(formData, "longDescriptionEn"),
      priceMode: getPriceMode(formData),
      priceAmount: getOptionalDecimalValue(formData, "priceAmount"),
      isPublished: getCheckboxValue(formData, "isPublished"),
      imagesJson: getRequiredTextValue(formData, "imagesJson"),
    });
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("product_updated");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdminAuth();

  try {
    await deleteProductRecord(getRequiredTextValue(formData, "id"));
  } catch (error) {
    handleActionError(error);
  }

  revalidateCatalogPaths();
  redirectWithStatus("product_deleted");
}

function getTextValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredTextValue(formData: FormData, key: string): string {
  const value = getTextValue(formData, key);

  if (!value) {
    throw new CatalogMutationError(
      "missing_required_fields",
      "აუცილებელი ველები სრულად უნდა იყოს შევსებული."
    );
  }

  return value;
}

function getOptionalTextValue(formData: FormData, key: string): string | undefined {
  const value = getTextValue(formData, key);

  return value || undefined;
}

function getCheckboxValue(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function getRequiredPositiveInteger(formData: FormData, key: string): number {
  const value = getOptionalPositiveInteger(formData, key);

  if (!value) {
    throw new CatalogMutationError(
      "invalid_order",
      "მიმდევრობის ველი უნდა იყოს დადებითი მთელი რიცხვი."
    );
  }

  return value;
}

function getOptionalPositiveInteger(
  formData: FormData,
  key: string
): number | undefined {
  const rawValue = getTextValue(formData, key);

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    throw new CatalogMutationError(
      "invalid_order",
      "მიმდევრობის ველი უნდა იყოს დადებითი მთელი რიცხვი."
    );
  }

  return parsedValue;
}

function getOptionalDecimalValue(formData: FormData, key: string): number | undefined {
  const rawValue = getTextValue(formData, key);

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue.replace(",", "."));

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new CatalogMutationError(
      "invalid_price",
      "ფასის ველი უნდა იყოს სწორი რიცხვითი მნიშვნელობა."
    );
  }

  return parsedValue;
}

function getPriceMode(formData: FormData): "contact" | "fixed" {
  return getTextValue(formData, "priceMode") === "fixed" ? "fixed" : "contact";
}

function assertRequiredPhotoSlots(imagesJson: string): void {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(imagesJson);
  } catch {
    throw new CatalogMutationError("invalid_images", "ფოტოების სია არასწორია.");
  }

  if (!Array.isArray(parsedValue)) {
    throw new CatalogMutationError("invalid_images", "ფოტოების სია არასწორია.");
  }

  const availableKinds = new Set(
    parsedValue
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const maybeKind = (item as { kind?: unknown }).kind;
        return typeof maybeKind === "string" ? maybeKind : null;
      })
      .filter((kind): kind is string => Boolean(kind))
  );

  const hasAllRequiredPhotos = REQUIRED_PHOTO_KINDS.every((kind) =>
    availableKinds.has(kind)
  );

  if (!hasAllRequiredPhotos) {
    throw new CatalogMutationError(
      "missing_required_photos",
      "პროდუქტის შესაქმნელად სამივე სავალდებულო ფოტო უნდა აიტვირთოს."
    );
  }
}

function revalidateCatalogPaths(): void {
  // Purges the entire router and data cache tree so users see identical data across all languages and pages instantly.
  revalidatePath("/", "layout");
}

function handleActionError(error: unknown, tab?: string): never {
  if (error instanceof CatalogMutationError) {
    redirectWithError(error.code, tab);
  }

  console.error(error);
  redirectWithError("unexpected", tab);
}

function redirectWithStatus(code: string, tab?: string): never {
  redirect(buildAdminUrl(code, "status", tab));
}

function redirectWithError(code: string, tab?: string): never {
  redirect(buildAdminUrl(code, "error", tab));
}

function buildAdminUrl(
  code: string,
  kind: "status" | "error",
  tab?: string
): string {
  const searchParams = new URLSearchParams();
  searchParams.set(kind, code);

  if (tab) {
    searchParams.set("tab", tab);
  }

  return `/admin?${searchParams.toString()}`;
}
