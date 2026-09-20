import { getAdminCatalogSnapshot } from "@/lib/catalog/data";
import RegenerationPanel from "@/components/admin/RegenerationPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Regeneration | Admin",
};

export default async function RegenerationPage() {
  const { products, categories, groups } = await getAdminCatalogSnapshot();

  const regeneratableProducts = products.filter(
    (product) => Array.isArray(product.originalImages) && product.originalImages.length === 3
  );

  return (
    <div className="mx-auto max-w-7xl">
      <RegenerationPanel 
        products={regeneratableProducts} 
        categories={categories}
        groups={groups}
      />
    </div>
  );
}
