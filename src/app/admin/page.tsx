import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import AdminLogin from "@/components/admin/AdminLogin";
import CategoryPanel from "@/components/admin/CategoryPanel";
import GroupPanel from "@/components/admin/GroupPanel";
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
  group_has_categories:
    "ჯგუფის წაშლამდე მასში არსებული კატეგორიები უნდა წაიშალოს ან სხვა ჯგუფში გადავიდეს.",
  category_has_products:
    "კატეგორიის წაშლამდე მასში არსებული პროდუქტები უნდა წაიშალოს ან სხვა კატეგორიაში გადავიდეს.",
  group_not_found: "მითითებული ჯგუფი ვერ მოიძებნა.",
  category_not_found: "მითითებული კატეგორია ვერ მოიძებნა.",
  product_not_found: "მითითებული პროდუქტი ვერ მოიძებნა.",
  too_many_home_categories: "მთავარ გვერდზე საჩვენებლად დაშვებულია მხოლოდ 3 კატეგორია ერთ ჯგუფში.",
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
  const currentTab = getSingleParam(params.tab) || "categories";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F2ED] text-[#1A1A1A] font-mono selection:bg-[#0d59f2] selection:text-white">
      {/* SideNavBar */}
      {authState && (
        <aside className="hidden md:flex flex-col h-full border-r-2 border-black bg-[#F5F2ED] w-[260px] shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="p-6 border-b-2 border-black">
            <div className="text-xl font-black tracking-tighter text-black uppercase">KOKENI MFG.</div>
            <div className="font-mono uppercase tracking-widest text-[10px] mt-1 opacity-60">ADMIN_v2.0</div>
          </div>
          <nav className="flex-1 px-4 py-8 space-y-2">
            <div className="font-mono uppercase tracking-widest text-[10px] mb-4 opacity-40 px-4">SYSTEM_NAV</div>
            <Link
              href="/admin?tab=categories"
              className={`flex items-center gap-3 px-4 py-3 font-mono uppercase tracking-widest text-[11px] transition-colors duration-75 ${
                currentTab === 'categories'
                  ? 'bg-black text-white font-bold border-y border-black translate-x-1'
                  : 'text-black opacity-70 hover:opacity-100 hover:bg-[#0d59f2] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>category</span>
              <span>CATEGORIES</span>
            </Link>
            <Link
              href="/admin?tab=products"
              className={`flex items-center gap-3 px-4 py-3 font-mono uppercase tracking-widest text-[11px] transition-colors duration-75 ${
                currentTab === 'products'
                  ? 'bg-black text-white font-bold border-y border-black translate-x-1'
                  : 'text-black opacity-70 hover:opacity-100 hover:bg-[#0d59f2] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
              <span>PRODUCTS</span>
            </Link>
          </nav>
          <div className="p-4 mt-auto border-t-2 border-black">
            <Link
              href="/ka"
              className="flex items-center gap-3 px-4 py-3 text-black opacity-70 hover:opacity-100 hover:bg-[#0d59f2] hover:text-white transition-colors duration-75 font-mono uppercase tracking-widest text-[11px]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>public</span>
              <span>VIEW_SITE</span>
            </Link>
            <form action={logoutAction} className="mt-2">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 text-[#ba1a1a] opacity-80 hover:opacity-100 font-mono uppercase tracking-widest text-[11px] transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                <span>LOGOUT</span>
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[radial-gradient(#1A1A1A22_1px,transparent_1px)] [background-size:24px_24px]">
         {/* TopAppBar */}
         <header className="flex justify-between items-center w-full px-6 py-4 bg-white border-b-2 border-black shrink-0 z-10 sticky top-0">
           <div className="flex items-center gap-8">
             <div className="font-black text-2xl tracking-tighter border-2 border-black px-2 uppercase bg-white">SYSTEM_MANIFEST</div>
           </div>
           {authState && (
             <div className="flex items-center gap-4">
               <div className="w-8 h-8 bg-black flex items-center justify-center text-white cursor-pointer active:scale-95">
                 <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
               </div>
             </div>
           )}
         </header>

         {/* Workspace */}
         <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 [&::-webkit-scrollbar]:hidden max-w-[1600px] mx-auto w-full">
            {notice ? (
              <div
                className={`border-2 px-5 py-4 text-sm font-bold uppercase tracking-widest text-[11px] ${
                  notice.type === "error"
                    ? "border-[#ba1a1a] bg-[#ffdad6] text-[#93000a]"
                    : "border-black bg-[#dce1ff] text-black"
                }`}
              >
                [NOTICE] {notice.message}
              </div>
            ) : null}

            {!configured ? (
              <div className="border-2 border-black bg-white p-8 space-y-4">
                <h2 className="font-black text-2xl uppercase">CONFIGURATION_MISSING</h2>
                <p className="font-mono text-sm opacity-70">
                  ADMIN_PASSWORD and ADMIN_SESSION_SECRET need to be set in the environment variables.
                </p>
              </div>
            ) : null}

            {!authState && configured ? (
              <div className="max-w-md mx-auto mt-20">
                <AdminLogin configured={configured} />
              </div>
            ) : null}

            {authState ? (
              currentTab === 'categories' ? (
                <div className="space-y-12">
                   <CategoryPanel groups={catalog?.groups ?? []} categories={catalog?.categories ?? []} products={catalog?.products ?? []} />
                   <GroupPanel groups={catalog?.groups ?? []} categories={catalog?.categories ?? []} products={catalog?.products ?? []} />
                </div>
              ) : (
                <div className="space-y-12">
                   <ProductPanel groups={catalog?.groups ?? []} categories={catalog?.categories ?? []} products={catalog?.products ?? []} />
                </div>
              )
            ) : null}
         </div>
      </main>
    </div>
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
