import { getDictionary } from "@/utils/getDictionary";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import Capacity from "@/components/home/Capacity";
import Output from "@/components/home/Output";
import Blueprint from "@/components/home/Blueprint";
import Terminal from "@/components/home/Terminal";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const switchLang = lang === 'en' ? 'ka' : 'en';

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Global Grid */}
      <div className="grid-overlay pointer-events-none fixed"></div>
      
      {/* Global Header just for Lang Switch */}
      <header className="fixed top-0 w-full p-8 flex justify-end z-[100] mix-blend-difference text-white">
        <Link 
          href={`/${switchLang}`}
          className="font-mono text-sm font-bold uppercase hover:text-primary transition-colors border border-white/20 px-3 py-1 rounded-sm"
        >
          {switchLang}
        </Link>
      </header>

      <main className="relative z-10 flex flex-col w-full">
        <Hero dict={dict} />
        <Capacity dict={dict} />
        <Output dict={dict} />
        <Blueprint dict={dict} />
      </main>
      
      <Terminal dict={dict} />
    </div>
  );
}
