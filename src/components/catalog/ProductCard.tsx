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
    <div className="group relative flex flex-col border-2 border-text-heavy bg-surface overflow-hidden hover:border-black transition-colors cursor-pointer select-none h-full min-h-[480px]">
      
      {/* Dossier Header */}
      <div className="flex justify-between items-center p-4 border-b-2 border-text-heavy bg-surface group-hover:bg-text-heavy transition-colors z-20">
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-text-heavy group-hover:text-white transition-colors">
          {dict.catalog.index} {String(product.order).padStart(3, "0")}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border border-text-heavy text-text-heavy group-hover:border-white group-hover:text-white transition-colors">
          {product.images.length} ASSETS
        </span>
      </div>

      {/* Product Image Area */}
      <div className="relative flex-grow flex items-center justify-center p-8 overflow-hidden bg-[#E8E5E1] group-hover:bg-black transition-colors duration-500 z-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }}></div>

        {mainImage ? (
          <div className="relative w-full h-full min-h-[250px] mix-blend-multiply group-hover:mix-blend-normal transition-all duration-500 z-10">
            <Image
              src={mainImage}
              alt={product.name.ka}
              fill
              className="object-contain filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
            />
          </div>
        ) : (
          <div className="font-mono text-xs opacity-30 uppercase tracking-widest text-black group-hover:text-white transition-colors">
            {dict.catalog.empty}
          </div>
        )}
      </div>

      {/* Product Info Footer */}
      <div className="flex flex-col p-6 bg-surface border-t-2 border-text-heavy z-20">
        <h3 className="font-bold text-xl uppercase tracking-tighter text-text-heavy mb-2 line-clamp-2">
          {product.name.ka}
        </h3>
        <p className="font-mono text-xs text-text-main/60 uppercase line-clamp-1 mb-6">
          {product.shortDescription.ka}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-text-heavy/20">
          <span className="font-mono text-[11px] font-bold tracking-widest uppercase">
            {product.price.mode === "contact" 
              ? dict.catalog.price_contact 
              : `${dict.catalog.price_value} ${product.price.amount} ${product.price.currency}`
            }
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] font-black uppercase text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            {dict.catalog.view_product} →
          </span>
        </div>
      </div>
    </div>
  );
}
