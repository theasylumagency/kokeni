import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";
import { redirect } from "next/navigation";
import CategoriesView from "./CategoriesView";
import { getNotice } from "@/lib/admin/notices";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<any> }) {
  const authState = await isAdminAuthenticated();
  if (!authState) {
    redirect("/admin");
  }

  const catalog = await getAdminCatalogSnapshot();
  const notice = getNotice(await searchParams);

  if (catalog.groups.length === 0 && catalog.categories.length === 0) {
    // If no groups, prompt them to create one first. The original UI showed "MISSING DEPENDENCY".
    // We can just pass the empty lists and handle in the view.
  }

  return (
    <CategoriesView 
      groups={catalog.groups} 
      categories={catalog.categories} 
      products={catalog.products} 
      notice={notice} 
    />
  );
}
