import { getDictionary } from "@/utils/getDictionary";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { notFound } from "next/navigation";
import CatalogNavigation from "@/components/catalog/CatalogNavigation";
import GroupProductsContent from "@/components/catalog/GroupProductsContent";

export default async function GroupProductsPage({ params }: { params: Promise<{ lang: string, groupSlug: string }> }) {
  const { lang, groupSlug } = await params;
  
  const [dict, catalog] = await Promise.all([
    getDictionary(lang),
    getCatalogSnapshot()
  ]);

  const activeGroups = catalog.groups
    .filter((g) => g.isActive)
    .sort((a, b) => a.order - b.order);

  const group = activeGroups.find(g => g.slug === groupSlug);
  if (!group) {
    notFound();
  }

  const groupCategories = catalog.categories
    .filter(c => c.groupId === group.id && c.isActive)
    .sort((a, b) => a.order - b.order);

  // Get all published products belonging to the group's categories
  const groupProducts = catalog.products
    .filter(p => p.isPublished && groupCategories.some(c => c.id === p.categoryId))
    .sort((a, b) => a.order - b.order);

  const groupName = group.name[lang as 'ka' | 'en'] || group.name.ka;
  const descKey = `${group.slug}_desc` as keyof typeof dict.catalog;
  const upperKey = `${group.slug}_upper` as keyof typeof dict.catalog;
  const description = dict.catalog[descKey] as string | undefined;
  const upperTag = (dict.catalog[upperKey] as string | undefined) || groupName;

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#fcfcfc] text-[#1a1b1c] selection:bg-primary selection:text-white pt-14">
      
      {/* Top Navigation - Light Theme */}
      <CatalogNavigation groups={activeGroups} lang={lang} dict={dict} currentGroupSlug={group.slug} theme="light" />

      {/* Header / Intro text */}
      <header className="w-full px-4 lg:px-8 pt-16 lg:pt-24 pb-12 lg:pb-16 bg-[#f9f9fa] border-b border-black/5">
        <div className="max-w-[1600px] mx-auto">
          <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-4 block">
            {upperTag}
          </span>
          <h1 className="font-bold text-5xl md:text-6xl lg:text-8xl uppercase tracking-tighter mb-6 text-[#1a1b1c] leading-[0.9]">
            {groupName}
          </h1>
          <p className="font-mono text-sm lg:text-base text-[#1a1b1c]/60 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </header>

      {/* Main Content with Scroll Spy sidebar */}
      <GroupProductsContent 
        categories={groupCategories} 
        products={groupProducts} 
        lang={lang} 
        dict={dict} 
        groupSlug={groupSlug} 
      />

      {/* Light Footer */}
      <footer className="w-full flex justify-between items-center text-[10px] font-mono p-4 lg:p-8 border-t border-black/5 text-[#1a1b1c]/40 bg-[#f9f9fa]">
        <span>{new Date().getFullYear()} © KOKENI MFG. DIRECTORY VER 2.0</span>
        <span>EOF // GROUP PRODUCTS END</span>
      </footer>
    </div>
  );
}

