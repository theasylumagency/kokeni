import { getDictionary } from "@/utils/getDictionary";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import Capacity from "@/components/home/Capacity";
import Output from "@/components/home/Output";
import Blueprint from "@/components/home/Blueprint";
import Terminal from "@/components/home/Terminal";
import { getHomeDirections } from "@/lib/catalog/data";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

const HOME_META = {
  ka: {
    title: "KOKENI — დიპლომის, მენიუს და დოკუმენტის ყდები თბილისში",
    description: "1989 წლიდან ვამზადებთ დიპლომისა და დოკუმენტის ყდებს, მენიუს ყდებს, საქაღალდეებს და ბლოკნოტებს PVC-სა და ნატურალური ტყავისგან. ინდივიდუალური შეკვეთა, თბილისი.",
  },
  en: {
    title: "KOKENI — Diploma, Menu & Document Covers Made in Tbilisi",
    description: "Since 1989 we make custom diploma and document covers, menu covers, folders and notebooks in PVC and genuine leather. Made to order in Tbilisi, Georgia.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang === "en" ? "en" : "ka";
  return pageMetadata({ locale, ...HOME_META[locale], pathFor: l => `/${l}` });
}



export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [dict, directions] = await Promise.all([
    getDictionary(lang),
    getHomeDirections(lang === "en" ? "en" : "ka"),
  ]);

  const switchLang = lang === 'en' ? 'ka' : 'en';

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Global Grid */}
      <div className="grid-overlay pointer-events-none fixed"></div>
      


      <main className="relative z-10 flex flex-col w-full">
        <Hero dict={dict} />
        <Capacity dict={dict} />
        <Output dict={dict} />
        <Blueprint dict={dict} directions={directions} lang={lang} />
      </main>
      
      <Terminal dict={dict} />
    </div>
  );
}
