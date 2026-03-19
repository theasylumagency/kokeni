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
      className="relative flex flex-col lg:flex-row w-full border-b border-text-heavy/30 bg-surface scroll-mt-[135px]"
    >
      {/* Category Monolith (Sticky on Desktop) */}
      <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 border-b lg:border-b-0 lg:border-r border-text-heavy/30 bg-[#E8E5E1] p-10 lg:p-16 flex flex-col justify-between items-start">
        <div className="sticky top-[200px] flex flex-col gap-4">
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-text-main/50">
            INDEX DIRECTORY
          </p>
          <h2 className="font-bold text-3xl md:text-5xl uppercase tracking-tighter text-text-heavy leading-none break-words">
            {category.name.ka}
          </h2>
          <div className="h-[2px] w-12 bg-primary mt-4"></div>
        </div>

        <div className="hidden lg:flex w-full items-end justify-between font-mono text-[10px] uppercase tracking-widest text-text-main/40 mt-32">
          <span>{products.length} PRODUCTS</span>
          <span>{category.slug.toUpperCase()}</span>
        </div>
      </div>

      {/* Product dossiers matrix */}
      <div className="flex-grow p-6 lg:p-12 bg-background-light">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} dict={dict} />
          ))}
        </div>
      </div>
    </section>
  );
}
