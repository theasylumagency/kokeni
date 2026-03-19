import type { Dictionary } from "@/utils/getDictionary";
import type { Category } from "@/lib/catalog/types";

type CatalogHeroProps = {
  dict: Dictionary;
  categories: Category[];
};

export default function CatalogHero({ dict, categories }: CatalogHeroProps) {
  // We only show unique categories that have products in them
  return (
    <section className="relative flex w-full flex-col bg-text-heavy text-background-light pt-32 lg:pt-48 overflow-hidden z-10 border-b-2 border-text-heavy">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(to right, #86785aff 1px, transparent 1px), linear-gradient(to bottom, #86785aff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10 w-full px-6 lg:px-16 flex flex-col gap-6 lg:gap-12 pb-16">
        <h1 className="font-bold text-6xl md:text-8xl lg:text-[10rem] uppercase tracking-tighter leading-none text-white mix-blend-difference selection:bg-primary selection:text-white">
          {dict.catalog.title}
        </h1>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted max-w-xl">
          {dict.catalog.subtitle}
        </p>
      </div>

      {/* Sticky Category Ticker */}
      <div className="sticky top-[80px] z-50 w-full bg-text-heavy border-t border-muted/20 py-4 flex flex-nowrap overflow-x-auto hide-scrollbar">
        <div className="flex px-6 lg:px-16 gap-8">
          {categories.map((category) => (
            <a
              key={`ticker-${category.id}`}
              href={`#category-${category.slug}`}
              className="whitespace-nowrap font-mono text-xs font-bold uppercase tracking-widest text-muted hover:text-white transition-colors"
            >
              / {category.name.ka}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
