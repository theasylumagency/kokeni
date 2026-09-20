import { getDictionary } from "@/utils/getDictionary";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import CatalogHero from "@/components/catalog/CatalogHero";

export default async function CatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [dict, catalog] = await Promise.all([
    getDictionary(lang),
    getCatalogSnapshot()
  ]);

  // Filter out inactive groups and sort by order
  const activeGroups = catalog.groups
    .filter((g) => g.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-light text-text-heavy">
      <main className="relative z-10 flex flex-col w-full">
        <CatalogHero dict={dict} groups={activeGroups} lang={lang} />
      </main>

      {/* Footer minimal signature */}
      <footer className="w-full flex justify-between items-center text-[10px] font-mono p-8 border-t border-text-heavy/20 bg-text-heavy text-white/50 bg-[#474c51]">
        <span>{new Date().getFullYear()} © KOKENI MFG. DIRECTORY VER 2.0</span>
        <span>EOF // CATALOG END</span>
      </footer>
    </div>
  );
}
