import { getDictionary } from "@/utils/getDictionary";
import { getCatalogSnapshot } from "@/lib/catalog/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function GroupHubPage({ params }: { params: Promise<{ lang: string, groupSlug: string }> }) {
  const { lang, groupSlug } = await params;
  
  const [dict, catalog] = await Promise.all([
    getDictionary(lang),
    getCatalogSnapshot()
  ]);

  const group = catalog.groups.find(g => g.slug === groupSlug && g.isActive);
  if (!group) {
    notFound();
  }

  const groupCategories = catalog.categories
    .filter(c => c.groupId === group.id && c.isActive)
    .sort((a, b) => a.order - b.order);

  const groupName = group.name[lang as 'ka' | 'en'] || group.name.ka;

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-light text-text-heavy">
      <main className="relative z-10 flex flex-col w-full flex-grow">
        
        {/* Simple Hero Section for the Group */}
        <section className="bg-text-heavy text-white relative flex w-full flex-col pt-32 lg:pt-40 pb-20 px-6 lg:px-16 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full z-10">
            <Link 
              href={`/${lang}/catalog`}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 hover:text-white transition-colors mb-10"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 6H1M1 6L6 1M1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
              </svg>
              {dict.catalog?.title || "Catalog"}
            </Link>
            
            <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.9] selection:bg-primary selection:text-white">
              {groupName}
            </h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mt-6">
              {groupCategories.length} Categories
            </p>
          </div>

          {/* Decorative faint group name in background */}
          <div className="absolute -bottom-10 -right-10 text-[15rem] font-bold uppercase text-white/5 whitespace-nowrap pointer-events-none select-none overflow-hidden">
            {groupName}
          </div>
        </section>

        {/* Categories Grid (Rough Draft) */}
        <div className="w-full bg-background-light px-6 lg:px-16 py-20 flex-grow">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
            {groupCategories.length > 0 ? (
              groupCategories.map((category, index) => {
                const categoryName = category.name[lang as 'ka' | 'en'] || category.name.ka;
                
                return (
                  <Link
                    key={category.id}
                    href={`/${lang}/catalog/${group.slug}/${category.slug}`}
                    className="group flex flex-col gap-6"
                  >
                    {/* Placeholder for future photos */}
                    <div className="relative w-full aspect-[4/5] bg-[#e4e7e9] overflow-hidden border border-text-heavy/10">
                      <div className="absolute inset-0 bg-text-heavy/0 group-hover:bg-text-heavy/5 transition-colors duration-500 z-10" />
                      
                      <div className="absolute inset-0 flex items-center justify-center text-text-heavy/20 font-mono text-sm tracking-widest uppercase z-0">
                        [Photo Placeholder]
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-4 left-4 font-mono text-[10px] text-text-heavy/30">
                        NO. {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full border border-text-heavy/20 flex items-center justify-center group-hover:border-text-heavy/50 group-hover:bg-text-heavy/10 transition-all duration-500">
                         <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-heavy opacity-50 group-hover:opacity-100">
                          <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
                        </svg>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <h2 className="font-bold text-2xl md:text-3xl uppercase tracking-tighter text-text-heavy group-hover:text-primary transition-colors duration-300">
                         {categoryName}
                       </h2>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full py-32 flex items-center justify-center">
                <p className="font-mono text-sm uppercase tracking-widest text-text-heavy/40">
                  {dict.catalog?.empty || "No categories found in this group."}
                </p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer minimal signature */}
      <footer className="w-full flex justify-between items-center text-[10px] font-mono p-8 border-t border-text-heavy/20 bg-text-heavy text-white/50">
        <span>{new Date().getFullYear()} © KOKENI MFG. DIRECTORY VER 2.0</span>
        <span>EOF // GROUP HUB END</span>
      </footer>
    </div>
  );
}
