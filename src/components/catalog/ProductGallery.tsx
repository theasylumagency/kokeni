"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/catalog/types";

export default function ProductGallery({ images, name, lang }: { images: ProductImage[]; name: string; lang: string }) {
  const ordered = [...images].sort((a, b) => a.order - b.order);
  const [selectedId, setSelectedId] = useState(ordered.find(image => image.role === "main")?.id || ordered[0]?.id);
  const selected = ordered.find(image => image.id === selectedId) || ordered[0];
  if (!selected) return <div className="flex aspect-square items-center justify-center bg-black/5 text-sm text-gray-400">{lang === "en" ? "Photo coming soon" : "ფოტო მალე დაემატება"}</div>;
  return <div>
    <a href={selected.src} target="_blank" rel="noreferrer" className="relative block aspect-square overflow-hidden rounded-sm bg-[#f0ece9]" aria-label={lang === "en" ? "Open full-size photo" : "ფოტოს სრული ზომით გახსნა"}>
      <Image src={selected.src} alt={`${name}${selected.label ? ` — ${selected.label}` : ""}`} fill unoptimized className="object-contain" preload />
    </a>
    {ordered.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto pb-2" aria-label={lang === "en" ? "Product gallery" : "პროდუქტის გალერეა"}>
      {ordered.map((image,index) => <button key={image.id} type="button" aria-pressed={selected.id === image.id} aria-label={image.label || `${name} — ${index + 1}`} onClick={() => setSelectedId(image.id)} className={`relative h-20 w-20 shrink-0 border-2 bg-[#f0ece9] ${selected.id === image.id ? "border-[#1a1b1c]" : "border-transparent"}`}><Image src={image.src} alt="" fill unoptimized className="object-contain" /></button>)}
    </div>}
  </div>;
}
