import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";
import AdminLogin from "@/components/admin/AdminLogin";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

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
  unexpected: "Unexpected error occurred.",
};

function getSingleParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getNotice(params: {
  error?: string | string[];
  status?: string | string[];
}): { type: "error" | "success"; message: string } | null {
  const status = getSingleParam(params.status);
  const error = getSingleParam(params.error);
  if (error) return { type: "error", message: errorMessages[error] ?? error };
  if (status) return { type: "success", message: statusMessages[status] ?? status };
  return null;
}

export default async function AdminDashboardPage({ searchParams }: AdminPageProps) {
  const [authState, configured, params] = await Promise.all([
    isAdminAuthenticated(),
    Promise.resolve(isAdminConfigured()),
    searchParams,
  ]);

  const notice = getNotice(params);

  if (!configured) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
          <h2 className="text-lg font-bold">Configuration Missing</h2>
          <p className="text-sm">
            ADMIN_PASSWORD and ADMIN_SESSION_SECRET need to be set in the
            environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!authState) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        {notice && (
          <div className={`p-4 text-center text-sm font-medium ${notice.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
            {notice.message}
          </div>
        )}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kokeni Admin</h1>
              <p className="text-sm text-gray-500 mt-2">Sign in to manage your store</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <AdminLogin configured={configured} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const catalog = await getAdminCatalogSnapshot();

  return (
    <div className="space-y-6">
      {notice && (
        <div className={`rounded-md p-4 text-sm font-medium ${notice.type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-500" : "bg-green-50 text-green-800 border-l-4 border-green-500"}`}>
          {notice.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome to Kokeni store management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <span className="material-symbols-outlined">folder_open</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Groups</p>
              <p className="text-3xl font-bold text-gray-900">{catalog.groups.length}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <span className="material-symbols-outlined">category</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Categories</p>
              <p className="text-3xl font-bold text-gray-900">{catalog.categories.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{catalog.products.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
