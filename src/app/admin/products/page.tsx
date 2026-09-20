import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";
import { redirect } from "next/navigation";
import ProductsView from "./ProductsView";
import { getNotice } from "@/lib/admin/notices";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<any> }) {
  const authState = await isAdminAuthenticated();
  if (!authState) {
    redirect("/admin");
  }

  const catalog = await getAdminCatalogSnapshot();
  const notice = getNotice(await searchParams);

  return (
    <ProductsView 
      groups={catalog.groups} 
      categories={catalog.categories} 
      products={catalog.products} 
      notice={notice} 
    />
  );
}
