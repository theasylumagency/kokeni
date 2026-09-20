import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";
import { redirect } from "next/navigation";
import PhotoGenerationPanel from "@/components/admin/PhotoGenerationPanel";

export const dynamic = "force-dynamic";

export default async function PhotoGenerationPage() {
  const authState = await isAdminAuthenticated();
  if (!authState) {
    redirect("/admin");
  }

  const catalog = await getAdminCatalogSnapshot();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI Photo Generation</h1>
          <p className="text-sm text-gray-500">Capture photos and generate AI enhancements for products.</p>
        </div>
      </div>
      <PhotoGenerationPanel 
        groups={catalog.groups} 
        categories={catalog.categories} 
        products={catalog.products} 
      />
    </div>
  );
}
