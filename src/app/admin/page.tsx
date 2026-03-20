import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import AdminLogin from "@/components/admin/AdminLogin";
import CategoryPanel from "@/components/admin/CategoryPanel";
import GroupPanel from "@/components/admin/GroupPanel";
import PhotoGenerationPanel from "@/components/admin/PhotoGenerationPanel";
import ProductPanel from "@/components/admin/ProductPanel";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
    tab?: string | string[];
  }>;
};

const statusMessages: Record<string, string> = {
  logged_in: "ავტორიზაცია წარმატებით დასრულდა.",
  logged_out: "სესიიდან გამოხვედით.",
  group_created: "ჯგუფი დაემატა.",
  group_updated: "ჯგუფი განახლდა.",
  group_deleted: "ჯგუფი წაიშალა.",
  category_created: "კატეგორია დაემატა.",
  category_updated: "კატეგორია განახლდა.",
  category_deleted: "კატეგორია წაიშალა.",
  product_created: "პროდუქტი დაემატა.",
  product_updated: "პროდუქტი განახლდა.",
  product_deleted: "პროდუქტი წაიშალა.",
  photo_product_created: "პროდუქტი დრაფტად შეიქმნა.",
};

const errorMessages: Record<string, string> = {
  unauthorized: "ამ ქმედებისთვის ჯერ ავტორიზაციაა საჭირო.",
  config_missing:
    "ადმინისტრატორის პარამეტრები დაყენებული არ არის. შეავსეთ ADMIN_PASSWORD და ADMIN_SESSION_SECRET.",
  login_failed: "პაროლი არასწორია.",
  missing_required_fields: "აუცილებელი ველები სრულად უნდა იყოს შევსებული.",
  invalid_order: "მიმდევრობის ველი უნდა იყოს დადებითი მთელი რიცხვი.",
  invalid_price: "ფასის ველი უნდა იყოს სწორი რიცხვითი მნიშვნელობა.",
  invalid_image_type: "დასაშვებია მხოლოდ JPG, PNG და WEBP სურათები.",
  invalid_images: "ფოტოების მონაცემები არასწორია.",
  group_has_categories:
    "ჯგუფის წაშლამდე მასში არსებული კატეგორიები უნდა წაიშალოს ან სხვა ჯგუფში გადაიტანოთ.",
  category_has_products:
    "კატეგორიის წაშლამდე მასში არსებული პროდუქტები უნდა წაიშალოს ან სხვა კატეგორიაში გადაიტანოთ.",
  group_not_found: "მითითებული ჯგუფი ვერ მოიძებნა.",
  category_not_found: "მითითებული კატეგორია ვერ მოიძებნა.",
  product_not_found: "მითითებული პროდუქტი ვერ მოიძებნა.",
  too_many_home_categories:
    "მთავარ გვერდზე საჩვენებლად ერთ ჯგუფში მხოლოდ 3 კატეგორია შეიძლება იყოს მონიშნული.",
  missing_required_photos:
    "ახალი პროდუქტის შესაქმნელად სამივე ფოტო აუცილებელია.",
  unexpected: "მოულოდნელი შეცდომა მოხდა. სცადეთ თავიდან.",
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [authState, configured, params] = await Promise.all([
    isAdminAuthenticated(),
    Promise.resolve(isAdminConfigured()),
    searchParams,
  ]);

  const notice = getNotice(params);
  const catalog = authState ? await getAdminCatalogSnapshot() : null;
  const requestedTab = getSingleParam(params.tab);
  const currentTab =
    requestedTab === "products" || requestedTab === "photo-generation"
      ? requestedTab
      : "categories";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F2ED] font-mono text-[#1A1A1A] selection:bg-[#0d59f2] selection:text-white">
      {authState ? <AdminSidebar currentTab={currentTab} /> : null}

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(#1A1A1A22_1px,transparent_1px)] [background-size:24px_24px]">
        <header className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-between border-b-2 border-black bg-white px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="border-2 border-black bg-white px-2 text-2xl font-black uppercase tracking-tighter">
              SYSTEM_MANIFEST
            </div>
          </div>
          {authState ? (
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  account_circle
                </span>
              </div>
            </div>
          ) : null}
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col space-y-8 overflow-y-auto p-6 lg:p-12 [&::-webkit-scrollbar]:hidden">
          {authState ? <AdminMobileNav currentTab={currentTab} /> : null}

          {notice ? (
            <div
              className={`border-2 px-5 py-4 text-[11px] font-bold uppercase tracking-widest ${notice.type === "error"
                  ? "border-[#ba1a1a] bg-[#ffdad6] text-[#93000a]"
                  : "border-black bg-[#dce1ff] text-black"
                }`}
            >
              [NOTICE] {notice.message}
            </div>
          ) : null}

          {!configured ? (
            <div className="space-y-4 border-2 border-black bg-white p-8">
              <h2 className="text-2xl font-black uppercase">
                CONFIGURATION_MISSING
              </h2>
              <p className="text-sm opacity-70">
                ADMIN_PASSWORD and ADMIN_SESSION_SECRET need to be set in the
                environment variables.
              </p>
            </div>
          ) : null}

          {!authState && configured ? (
            <div className="mx-auto mt-20 max-w-md">
              <AdminLogin configured={configured} />
            </div>
          ) : null}

          {authState ? (
            currentTab === "categories" ? (
              <div className="space-y-12">
                <CategoryPanel
                  groups={catalog?.groups ?? []}
                  categories={catalog?.categories ?? []}
                  products={catalog?.products ?? []}
                />
                <GroupPanel
                  groups={catalog?.groups ?? []}
                  categories={catalog?.categories ?? []}
                  products={catalog?.products ?? []}
                />
              </div>
            ) : currentTab === "products" ? (
              <div className="space-y-12">
                <ProductPanel
                  groups={catalog?.groups ?? []}
                  categories={catalog?.categories ?? []}
                  products={catalog?.products ?? []}
                />
              </div>
            ) : (
              <div className="space-y-12">
                <PhotoGenerationPanel
                  groups={catalog?.groups ?? []}
                  categories={catalog?.categories ?? []}
                  products={catalog?.products ?? []}
                />
              </div>
            )
          ) : null}
        </div>
      </main>
    </div>
  );
}

function AdminSidebar({ currentTab }: { currentTab: string }) {
  return (
    <aside className="hidden h-full w-[260px] shrink-0 flex-col overflow-y-auto border-r-2 border-black bg-[#F5F2ED] md:flex [&::-webkit-scrollbar]:hidden">
      <div className="border-b-2 border-black p-6">
        <div className="text-xl font-black uppercase tracking-tighter text-black">
          KOKENI MFG.
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-widest opacity-60">
          ADMIN_v2.0
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-8">
        <div className="mb-4 px-4 text-[10px] uppercase tracking-widest opacity-40">
          SYSTEM_NAV
        </div>
        <AdminSidebarLink
          href="/admin?tab=categories"
          icon="category"
          label="CATEGORIES"
          active={currentTab === "categories"}
        />
        <AdminSidebarLink
          href="/admin?tab=products"
          icon="inventory_2"
          label="PRODUCTS"
          active={currentTab === "products"}
        />
        <AdminSidebarLink
          href="/admin?tab=photo-generation"
          icon="photo_camera"
          label="ფოტოებით შექმნა"
          active={currentTab === "photo-generation"}
        />
      </nav>

      <div className="mt-auto border-t-2 border-black p-4">
        <Link
          href="/ka"
          className="flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest text-black opacity-70 transition-colors duration-75 hover:bg-[#0d59f2] hover:text-white hover:opacity-100"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "20px" }}
          >
            public
          </span>
          <span>VIEW_SITE</span>
        </Link>

        <form action={logoutAction} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest text-[#ba1a1a] opacity-80 transition-colors hover:opacity-100"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              logout
            </span>
            <span>LOGOUT</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function AdminSidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest transition-colors duration-75 ${active
          ? "translate-x-1 border-y border-black bg-black font-bold text-white"
          : "text-black opacity-70 hover:bg-[#0d59f2] hover:text-white hover:opacity-100"
        }`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function AdminMobileNav({ currentTab }: { currentTab: string }) {
  return (
    <nav className="flex gap-3 overflow-x-auto pb-2 min-h-fit md:hidden [&::-webkit-scrollbar]:hidden">
      <AdminMobileNavLink
        href="/admin?tab=categories"
        label="კატეგორიები"
        active={currentTab === "categories"}
      />
      <AdminMobileNavLink
        href="/admin?tab=products"
        label="პროდუქტები"
        active={currentTab === "products"}
      />
      <AdminMobileNavLink
        href="/admin?tab=photo-generation"
        label="ფოტოებით შექმნა"
        active={currentTab === "photo-generation"}
      />
    </nav>
  );
}

function AdminMobileNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 border-2 border-black px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] ${active ? "bg-black text-white" : "bg-white text-black"
        }`}
    >
      {label}
    </Link>
  );
}

function getNotice(params: {
  error?: string | string[];
  status?: string | string[];
}): { type: "error" | "success"; message: string } | null {
  const status = getSingleParam(params.status);
  const error = getSingleParam(params.error);

  if (error) {
    return {
      type: "error",
      message: errorMessages[error] ?? error,
    };
  }

  if (status) {
    return {
      type: "success",
      message: statusMessages[status] ?? status,
    };
  }

  return null;
}

function getSingleParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
