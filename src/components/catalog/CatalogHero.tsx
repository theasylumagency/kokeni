import type { Dictionary } from "@/utils/getDictionary";
import type { Category } from "@/lib/catalog/types";

type CatalogHeroProps = {
  dict: Dictionary;
  categories: Category[];
};

export default function CatalogHero({ dict, categories }: CatalogHeroProps) {
  return (
    <section className="relative flex w-full flex-col bg-background-light pt-32 lg:pt-48 overflow-hidden z-20">
      <div className="relative w-full px-6 lg:px-16 flex flex-col items-center text-center gap-6 lg:gap-8 pb-20 lg:pb-32">
        <p className="font-mono text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-text-heavy/50">
          — KOKENI MFG. DIRECTORY —
        </p>
        <h1 className="font-bold text-5xl md:text-7xl lg:text-[9rem] uppercase tracking-tighter leading-[0.9] text-text-heavy selection:bg-primary selection:text-white max-w-6xl mx-auto">
          {dict.catalog.title}
        </h1>
        <p className="text-sm md:text-base font-medium tracking-wide text-text-heavy/60 max-w-2xl mt-4 leading-relaxed">
          {dict.catalog.subtitle}
        </p>
      </div>

      {/* Elegant Sticky Navigation */}
      <div className="sticky top-[80px] z-50 w-full bg-background-light/80 backdrop-blur-xl border-y border-text-heavy/10 py-5 flex flex-nowrap overflow-x-auto hide-scrollbar shadow-sm">
        <div className="flex px-6 lg:px-16 gap-10 md:gap-14 mx-auto">
          {categories.map((category) => (
            <a
              key={`nav-${category.id}`}
              href={`#category-${category.slug}`}
              className="whitespace-nowrap font-bold text-xs uppercase tracking-[0.15em] text-text-heavy/60 hover:text-text-heavy transition-all duration-300 relative after:absolute after:-bottom-[20px] after:left-0 after:w-full after:h-[2px] after:bg-text-heavy after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              {category.name.ka}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
