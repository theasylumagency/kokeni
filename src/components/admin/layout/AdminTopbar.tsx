import { logoutAction } from "@/app/admin/actions";

export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-4 pl-12 md:pl-0">
        {/* Breadcrumbs or page title could be injected here */}
      </div>
      <div className="flex items-center gap-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
