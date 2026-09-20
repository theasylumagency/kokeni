"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import justKokeniLogo from "../../../public/logo/just_kokeni.svg";
import type { Dictionary } from "@/utils/getDictionary";

interface NavigationProps {
  dict: Dictionary;
  lang: string;
}

export default function Navigation({ dict, lang }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const switchLang = lang === "en" ? "ka" : "en";

  return (
    <>
      <header className="bg-[#747c83] inset-shadow fixed top-0 w-full z-[100] h-14 px-5 md:px-8 flex items-center justify-between text-white pointer-events-auto">
        {/* Left Axis: Logo */}
        <div className="flex items-center">
          <Link href={`/${lang}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Image
              src={justKokeniLogo}
              alt="Kokeni Logo"
              width={120}
              height={24}
              className="h-4 md:h-5 w-auto object-contain cursor-pointer invert"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Center Axis: Navigation Links (Desktop) */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-8">
          <Link
            href={`/${lang}/catalog`}
            className="font-display text-[11px] uppercase hover:text-primary transition-colors tracking-widest"
          >
            {dict.nav.shop}
          </Link>
          <Link
            href={`/${lang}#about`}
            className="font-display text-[11px] uppercase hover:text-primary transition-colors tracking-widest"
          >
            {dict.nav.about}
          </Link>
          <Link
            href={`/${lang}#contact`}
            className="font-display text-[11px] uppercase hover:text-primary transition-colors tracking-widest"
          >
            {dict.nav.contact}
          </Link>
        </nav>

        {/* Right Axis: Utils */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            href={`/${switchLang}`}
            className="font-mono text-[11px] font-bold uppercase hover:text-primary transition-colors tracking-widest border border-white/20 px-2 py-0.5 rounded-sm"
          >
            {switchLang}
          </Link>

          {/* User & Cart Icons */}
          <button className="flex items-center justify-center hover:text-primary transition-colors" title={dict.nav.profile}>
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>

          <button className="flex items-center justify-center hover:text-primary transition-colors" title={dict.nav.cart}>
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="flex items-center justify-center md:hidden hover:text-primary transition-colors z-[110]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Fullscreen Overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-background-light text-text-heavy flex flex-col justify-center items-center gap-8 transition-transform duration-500 ease-[cubic-bezier(0.83,0,0.17,1)] md:hidden ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
      >
        <nav className="flex flex-col items-center gap-8">
          <Link
            href={`/${lang}/catalog`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-display text-4xl uppercase font-bold tracking-tight hover:text-primary transition-colors"
          >
            {dict.nav.shop}
          </Link>
          <Link
            href={`/${lang}#about`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-display text-4xl uppercase font-bold tracking-tight hover:text-primary transition-colors"
          >
            {dict.nav.about}
          </Link>
          <Link
            href={`/${lang}#contact`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-display text-4xl uppercase font-bold tracking-tight hover:text-primary transition-colors"
          >
            {dict.nav.contact}
          </Link>
        </nav>
      </div>
    </>
  );
}
