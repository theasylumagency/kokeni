const statusMessages: Record<string, string> = {
  logged_in: "Logged in successfully.",
  logged_out: "Logged out successfully.",
  group_created: "Group created.",
  group_updated: "Group updated.",
  group_deleted: "Group deleted.",
  category_created: "Category created.",
  category_updated: "Category updated.",
  category_deleted: "Category deleted.",
  product_created: "Product created.",
  product_updated: "Product updated.",
  product_deleted: "Product deleted.",
  photo_product_created: "Product draft created from photo.",
};

const errorMessages: Record<string, string> = {
  unauthorized: "Authentication required.",
  config_missing: "Admin configuration missing.",
  login_failed: "Invalid password.",
  missing_required_fields: "Required fields missing.",
  invalid_order: "Order must be a positive integer.",
  invalid_price: "Invalid price value.",
  invalid_image_type: "Only JPG, PNG and WEBP allowed.",
  invalid_images: "Invalid image data.",
  group_has_categories: "Delete or move categories before deleting group.",
  category_has_products: "Delete or move products before deleting category.",
  group_not_found: "Group not found.",
  category_not_found: "Category not found.",
  product_not_found: "Product not found.",
  too_many_home_categories: "Only 3 categories can be shown on home per group.",
  missing_required_photos: "All three photos are required for new product.",
  invalid_attributes: "მახასიათებელს სჭირდება ქართული დასახელება და მნიშვნელობა. მაქსიმუმ 24 ჩანაწერი, ველი 500 სიმბოლომდე.",
  invalid_faq: "კითხვას და პასუხს ქართული ტექსტი სჭირდება. მაქსიმუმ 24 კითხვა, პასუხი 2000 სიმბოლომდე.",
  invalid_order_terms: "შეკვეთის პირობები: რაოდენობა და ვადა — დადებითი მთელი რიცხვი (მაქსიმუმი ≥ მინიმუმი), ფასი — დადებითი რიცხვი ან ცარიელი.",
  invalid_related_types: "აირჩიეთ არსებული, განსხვავებული ნივთის ტიპები.",
  invalid_cover_product: "მთავარი ფოტო უნდა ეკუთვნოდეს ამ ტიპის ნამუშევარს.",
  unexpected: "Unexpected error occurred.",
};

function getSingleParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getNotice(params: {
  error?: string | string[] | Promise<string | string[] | undefined>;
  status?: string | string[] | Promise<string | string[] | undefined>;
}): { type: "error" | "success"; message: string } | null {
  const status = getSingleParam(params.status as any);
  const error = getSingleParam(params.error as any);
  
  if (error) return { type: "error", message: errorMessages[error] ?? error };
  if (status) return { type: "success", message: statusMessages[status] ?? status };
  return null;
}
