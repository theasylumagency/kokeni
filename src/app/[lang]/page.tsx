import { getDictionary } from "@/utils/getDictionary";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import Capacity from "@/components/home/Capacity";
import Output from "@/components/home/Output";
import Blueprint from "@/components/home/Blueprint";
import Terminal from "@/components/home/Terminal";
import { getHomeDirections } from "@/lib/catalog/data";



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
        <Blueprint dict={dict} directions={directions} />
      </main>
      
      <Terminal dict={dict} />
    </div>
  );
}
