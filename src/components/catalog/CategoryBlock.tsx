import type { Category, Product } from "@/lib/catalog/types";
import type { Dictionary } from "@/utils/getDictionary";
import ProductCard from "./ProductCard";

type CategoryBlockProps = {
  category: Category;
  products: Product[];
  dict: Dictionary;
};

export default function CategoryBlock({ category, products, dict }: CategoryBlockProps) {
  if (products.length === 0) return null;

  return (

    <section

      id={`category-${category.slug}`}
      className="relative flex flex-col w-full bg-background-light py-24 scroll-mt-[135px] border-b border-text-heavy/10 last:border-0"
    >

      {/* Category Header (Elegant Top-aligned) */}
      <div className="w-full px-6 lg:px-16 flex flex-col items-center md:items-start mb-16 lg:mb-20">
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-primary/80 mb-4">
          — {products.length} {dict.catalog.title}
        </p>
        <h2 className="font-bold text-2xl lg:text-xl xl:text-4xl uppercase tracking-tighter text-text-heavy leading-[0.9] text-center md:text-left break-words max-w-4xl">
          {category.name.ka}
        </h2>
      </div>

      {/* Product Grid */}
      <div className="w-full px-6 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-16 lg:gap-x-12 lg:gap-y-24">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} dict={dict} />
          ))}
        </div>
      </div>
    </section>
  );
}
