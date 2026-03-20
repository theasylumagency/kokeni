import { getDictionary } from "@/utils/getDictionary";
import Link from "next/link";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import CatalogHero from "@/components/catalog/CatalogHero";
import CategoryBlock from "@/components/catalog/CategoryBlock";


export default async function CatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [dict, catalog] = await Promise.all([
    getDictionary(lang),
    getCatalogSnapshot()
  ]);

  const switchLang = lang === 'en' ? 'ka' : 'en';

  // 1. Filter out inactive categories
  const activeCategories = catalog.categories.filter((c) => c.isActive);
  
  // 2. Filter out unpublished products
  const publishedProducts = catalog.products.filter((p) => p.isPublished);

  // 3. Find which categories actually have products
  const categoriesWithProducts = activeCategories.filter((category) => {
    return publishedProducts.some((p) => p.categoryId === category.id);
  });

  // 4. Sort categories by their order property
  categoriesWithProducts.sort((a, b) => a.order - b.order);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-light text-text-heavy">
      {/* Global Header */}
      <header className="fixed top-0 w-full p-8 flex justify-between items-center z-[100] mix-blend-difference text-white">
        <Link 
          href={`/${lang}`}
          className="font-mono text-sm font-bold uppercase hover:text-primary transition-colors tracking-widest"
        >
          ← HOME_SYS.
        </Link>
        <Link 
          href={`/${switchLang}/catalog`}
          className="font-mono text-sm font-bold uppercase hover:text-primary transition-colors border border-white/20 px-3 py-1 rounded-sm tracking-widest bg-black/50 backdrop-blur-sm"
        >
          {switchLang}
        </Link>
      </header>

      <main className="relative z-10 flex flex-col w-full">
        <CatalogHero dict={dict} categories={categoriesWithProducts} />

        <div className="flex flex-col w-full">
          {categoriesWithProducts.length > 0 ? (
            categoriesWithProducts.map((category) => {
              const categoryProducts = publishedProducts
                .filter((p) => p.categoryId === category.id)
                .sort((a, b) => a.order - b.order);

              return (
                <CategoryBlock 
                  key={category.id} 
                  category={category} 
                  products={categoryProducts} 
                  dict={dict} 
                />
              );
            })
          ) : (
            <div className="w-full h-[50vh] flex flex-col items-center justify-center font-mono text-sm uppercase tracking-widest opacity-50">
              {dict.catalog.empty}
            </div>
          )}
        </div>
      </main>

      {/* Footer minimal signature */}
      <footer className="w-full flex justify-between items-center text-[10px] font-mono p-8 border-t border-text-heavy/20 bg-text-heavy text-white/50">
        <span>{new Date().getFullYear()} © KOKENI MFG. DIRECTORY VER 2.0</span>
        <span>EOF // CATALOG END</span>
      </footer>
    </div>
  );
}
