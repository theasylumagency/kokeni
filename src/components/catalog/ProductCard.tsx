import Image from "next/image";
import type { Product } from "@/lib/catalog/types";
import type { Dictionary } from "@/utils/getDictionary";

type ProductCardProps = {
  product: Product;
  dict: Dictionary;
};

export default function ProductCard({ product, dict }: ProductCardProps) {
  const mainImage = product.images.length > 0 ? product.images[0].src : null;

  return (
    <div className="group relative flex flex-col h-full min-h-[460px] cursor-pointer">
      
      {/* Product Image Area */}
      <div className="relative flex-grow flex items-center justify-center p-8 overflow-hidden bg-text-heavy/[0.03] rounded-sm transition-all duration-500 ease-out z-10">
        
        {mainImage ? (
          <div className="relative w-full h-full min-h-[300px] z-10 transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110">
            <Image
              src={mainImage}
              alt={product.name.ka}
              fill
              className="object-contain drop-shadow-sm"
              unoptimized
            />
          </div>
        ) : (
          <div className="font-mono text-[10px] uppercase tracking-widest text-text-main/30">
            {dict.catalog.empty}
          </div>
        )}

        {/* Subtle premium hover overlay */}
        <div className="absolute inset-0 bg-text-heavy/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-multiply z-20"></div>
      </div>

      {/* Product Info Footer (Elegant) */}
      <div className="flex flex-col pt-6 z-20">
        <h3 className="font-bold text-lg md:text-xl uppercase tracking-tighter text-text-heavy leading-tight line-clamp-2">
          {product.name.ka}
        </h3>
        <p className="font-medium text-[13px] text-text-main/50 mt-2 line-clamp-1 leading-relaxed">
          {product.shortDescription.ka}
        </p>

        <div className="flex items-center justify-between mt-6">
          <span className="font-mono text-xs font-bold tracking-[0.1em] text-text-heavy">
            {product.price.mode === "contact" 
              ? dict.catalog.price_contact 
              : `${product.price.amount} ${product.price.currency}`
            }
          </span>
          <span className="font-sans text-[11px] font-bold tracking-widest uppercase text-text-heavy/40 group-hover:text-primary transition-colors duration-300">
            — {dict.catalog.view_product}
          </span>
        </div>
      </div>
    </div>
  );
}
