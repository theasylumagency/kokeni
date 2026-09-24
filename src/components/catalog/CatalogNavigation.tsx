"use client";

import Link from "next/link";
import { sectorPath } from "@/lib/catalog/urls";

interface Group {
  id: string;
  slug: string;
  name: { ka: string; en?: string };
  isActive: boolean;
  order: number;
}

interface CatalogNavigationProps {
  groups: Group[];
  lang: string;
  dict: any;
  currentGroupSlug?: string;
  theme?: "dark" | "light";
}

export default function CatalogNavigation({ 
  groups, 
  lang, 
  dict, 
  currentGroupSlug,
  theme = "dark" 
}: CatalogNavigationProps) {
  
  const isLight = theme === "light";
  
  const navClasses = isLight 
    ? "bg-[#f9f9fa]/90 border-black/10 text-text-heavy" 
    : "bg-background-dark/90 border-white/10 text-white";

  // 10-12px labels: needs the ink step on paper, the bright step on dark.
  const accent = isLight ? "text-primary-ink" : "text-primary-bright";
  const accentBorder = isLight ? "border-primary-ink" : "border-primary-bright";

  const hubLinkIdle = isLight ? "text-text-heavy/50 hover:text-text-heavy" : "text-white/50 hover:text-white";
  const groupLinkIdle = isLight ? "text-text-heavy/50 hover:text-text-heavy" : "text-white/50 hover:text-white";

  return (
    <nav className={`sticky top-14 z-50 w-full backdrop-blur-md border-b uppercase font-mono text-[10px] sm:text-xs ${navClasses}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between overflow-x-auto hide-scrollbar">
        
        {/* Hub Link */}
        <div className="flex-shrink-0 mr-8">
          <Link 
            href={`/${lang}/catalog`}
            className={`flex items-center gap-2 tracking-widest transition-colors duration-300 ${!currentGroupSlug ? `${accent} border-b ${accentBorder} pb-1` : hubLinkIdle}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={!currentGroupSlug ? accent : (isLight ? "text-text-heavy/50" : "text-white/50")}>
              <path d="M1 6H11M6 1L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
            </svg>
            <span>{lang === "en" ? "All item types" : "ყველა ნივთის ტიპი"}</span>
          </Link>
        </div>

        {/* Groups List */}
        <div className="flex items-center gap-6 sm:gap-10">
          {groups.map((group) => {
            const isActive = currentGroupSlug === group.slug;
            const groupName = group.name[lang as 'ka' | 'en'] || group.name.ka;

            return (
              <Link
                key={group.id}
                href={sectorPath(lang, group)}
                data-ga-event="select_content" data-ga-content-type="catalog_sector" data-ga-content-id={group.slug}
                className={`tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${isActive ? `${accent} border-b ${accentBorder} pb-1` : groupLinkIdle}`}
              >
                {groupName}
              </Link>
            );
          })}
          

        </div>
      </div>
    </nav>
  );
}
