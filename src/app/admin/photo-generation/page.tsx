import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";
import { redirect } from "next/navigation";
import PhotoGenerationPanel from "@/components/admin/PhotoGenerationPanel";
import { listWorkflows } from "@/lib/photos/store";
import { providerConfigured } from "@/lib/photos/provider";

export const dynamic = "force-dynamic";

export default async function PhotoGenerationPage() {
  const authState = await isAdminAuthenticated();
  if (!authState) {
    redirect("/admin");
  }

  const [catalog, workflows] = await Promise.all([getAdminCatalogSnapshot(), listWorkflows()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">პროდუქტის ფოტოსტუდია</h1>
          <p className="text-sm text-gray-500">საწყისი ფოტოებიდან ერთიან გალერეამდე — თქვენი გეგმითა და დამტკიცებით.</p>
        </div>
      </div>
      <PhotoGenerationPanel 
        groups={catalog.groups} 
        categories={catalog.categories} 
        products={catalog.products} 
        workflows={workflows}
        configured={providerConfigured()}
      />
    </div>
  );
}
