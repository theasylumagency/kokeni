"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  slug: string;
  name: { ka: string; en?: string };
  order: number;
}

interface Product {
  id: string;
  slug: string;
  categoryId: string;
  name: { ka: string; en?: string };
  shortDescription?: { ka: string; en?: string };
  images?: { src: string }[];
  order: number;
}

interface GroupProductsContentProps {
  categories: Category[];
  products: Product[];
  lang: string;
  dict: any;
  groupSlug: string;
}

export default function GroupProductsContent({ categories, products, lang, dict, groupSlug }: GroupProductsContentProps) {
  const [activeSegment, setActiveSegment] = useState<string>("");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // triggers when element crosses upper/middle portion of viewport
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSegment(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all category sections
    categories.forEach(category => {
      const element = document.getElementById(category.slug);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [categories]);

  return (
    <main className="flex-grow w-full px-4 lg:px-8 py-12 lg:py-20">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">

        {/* Left Sidebar (Categories) - Client Component for active logic */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-32 flex flex-col gap-8">
            <h2 className="font-mono text-xs tracking-[0.2em] text-[#1a1b1c]/40 uppercase mb-2 border-b border-black/5 pb-4">
              // INDEX
            </h2>
            <nav className="flex flex-row lg:flex-col gap-6 overflow-x-auto lg:overflow-visible hide-scrollbar pb-4 lg:pb-0">
              {categories.map((category) => {
                const categoryName = category.name[lang as 'ka' | 'en'] || category.name.ka;
                const isActive = activeSegment === category.slug;

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      document.getElementById(category.slug)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap lg:whitespace-normal flex items-center gap-2 group text-left
                      ${isActive ? "text-primary" : "text-[#1a1b1c]/60 hover:text-[#1a1b1c]"}`}
                  >
                    <span className={`w-4 h-[1px] transition-colors duration-300 hidden lg:block ${isActive ? "bg-primary" : "bg-primary/0 group-hover:bg-primary/50"}`} />
                    {categoryName}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Content (Products) */}
        <div className="flex-grow flex flex-col gap-24 lg:gap-32">
          {categories.length === 0 && (
            <div className="w-full py-32 flex items-center justify-center border border-black/5 bg-[#f9f9fa]">
              <p className="font-mono text-sm uppercase tracking-widest text-[#1a1b1c]/40">
                {dict.catalog?.empty || "NO ASSETS FOUND"}
              </p>
            </div>
          )}

          {categories.map(category => {
            const categoryProducts = products.filter(p => p.categoryId === category.id);
            if (categoryProducts.length === 0) return null;

            const categoryName = category.name[lang as 'ka' | 'en'] || category.name.ka;

            return (
              <section key={category.id} id={category.slug} className="scroll-mt-32">

                {/* Category Header */}
                <div className="border-b border-black/10 pb-4 mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-2">
                  <h3 className="text-3xl lg:text-4xl font-bold uppercase tracking-tighter text-[#1a1b1c]">
                    {categoryName}
                  </h3>
                  <span className="font-mono text-[10px] text-[#1a1b1c]/40 tracking-widest">
                    [{categoryProducts.length} PRODUCTS]
                  </span>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 lg:gap-12">
                  {categoryProducts.map(product => {
                    const productName = product.name[lang as 'ka' | 'en'] || product.name.ka;
                    const firstImage = product.images?.[0]?.src;
                    const shortDesc = product.shortDescription?.[lang as 'ka' | 'en'] || product.shortDescription?.ka;

                    return (
                      <Link
                        key={product.id}
                        href={`/${lang}/catalog/${groupSlug}/${category.slug}/${product.slug}`}
                        className="group flex flex-col gap-6"
                      >
                        {/* Image Container with Paper/Matte feel */}
                        <div className="relative w-full aspect-square bg-[#f0ece9] overflow-hidden border border-black/5 group-hover:shadow-2xl group-hover:shadow-black/5 transition-all duration-700 flex items-center justify-center">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={productName}
                              className="w-full h-full object-contain filter contrast-125 brightness-95 group-hover:scale-105 transition-transform duration-[1.5s] ease-out drop-shadow-xl"
                            />
                          ) : (
                            <div className="font-mono text-[10px] text-[#1a1b1c]/20 tracking-widest uppercase">
                              NO SPECIMEN
                            </div>
                          )}

                          {/* Minimalist Overlay Label */}
                          <div className="absolute top-4 left-4 font-mono text-[10px] text-[#1a1b1c]/40 uppercase tracking-widest">
                            REF: {product.slug.substring(0, 8)}
                          </div>

                          <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all duration-500">
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-[#1a1b1c]/40 group-hover:text-primary transition-colors duration-500">
                              <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
                            </svg>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-2 px-1">
                          <h4 className="font-bold text-xl md:text-2xl uppercase tracking-tighter text-[#1a1b1c] group-hover:text-primary transition-colors duration-300">
                            {productName}
                          </h4>
                          {shortDesc && (
                            <p className="font-mono text-xs text-[#1a1b1c]/50 line-clamp-2">
                              {shortDesc}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
