import Image from "next/image";
import kokeniMark from "../../../public/logo/just_man.svg";
import HeroConstruction from "./HeroConstruction";
import SheetFrame from "./SheetFrame";
import type { Dictionary } from "@/utils/getDictionary";

/* PLACEHOLDER VALUES - George, replace MIN. RUN and LEAD TIME with the
   real numbers before the next deploy. EST. and ORIGIN are correct. */
const SPECS = [
    { k: "Est.", v: "1989" },
    { k: "Origin", v: "Tbilisi, GE" },
    { k: "Min. run", v: "50 pcs" },
    { k: "Lead time", v: "10–14 days" },
];

export default function Hero({ dict }: { dict: Dictionary }) {
    // One screen, no scroll-jacking. The drawing runs on its own clock and
    // is sized by the space it gets: full width on phones, the larger
    // column on desktops, capped by the viewport height on wide screens.
    return (
        <section className="relative w-full">
            <div className="relative flex min-h-[100svh] w-full flex-col px-5 pb-8 pt-20 sm:px-10 lg:pb-10 lg:pl-28 lg:pr-20 lg:pt-24">
                <SheetFrame />

                {/* Registration Marks (Top Left) */}
                <div className="absolute top-20 left-8 z-20 hidden flex-col items-center gap-2 lg:flex">
                    <span className="material-symbols-outlined text-primary text-base">add</span>
                    <span className="font-mono text-xs text-primary-ink">X:001</span>
                </div>
                {/* Registration Marks (Top Right) */}
                <div className="absolute top-20 right-8 z-20 hidden flex-col items-center gap-2 lg:flex">
                    <span className="material-symbols-outlined text-primary text-base">add</span>
                    <span className="font-mono text-xs text-primary-ink">Y:001</span>
                </div>

                {/* Left margin rail - fills the dead vertical strip beside the frame */}
                <div className="absolute left-14 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.35em] text-text-heavy/35 [writing-mode:vertical-rl] rotate-180">
                        Kokeni Mfg. · Sheet 01 of 05 · Drawn in Tbilisi
                    </span>
                </div>

                {/* Phones: headline, drawing, text. Desktop: text column + drawing column. */}
                <div className="relative z-10 mx-auto grid w-full max-w-[1800px] flex-1 grid-cols-1 content-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_auto] xl:gap-x-20">
                    <div className="flex flex-col lg:self-end">
                        <Image
                            src={kokeniMark}
                            alt="Kokeni"
                            width={160}
                            height={160}
                            className="mb-6 h-12 w-auto object-contain object-left lg:mb-8 lg:h-16 2xl:h-20"
                            priority
                            unoptimized
                        />
                        <h1 className="flex flex-col items-start text-balance text-[clamp(2.1rem,3.5vw,5.5rem)] font-bold uppercase leading-[0.98] tracking-tighter text-text-heavy">
                            <span>{dict.hero.title2}</span>{" "}
                            <span>{dict.hero.title3}</span>
                        </h1>
                    </div>

                    <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
                        <HeroConstruction labels={{ steps: dict.hero.steps, captions: dict.hero.captions, pause: dict.hero.pause, play: dict.hero.play, label: dict.hero.drawing_label }} />
                    </div>

                    <div className="flex flex-col lg:self-start">
                        <p className="max-w-xl font-mono text-sm leading-relaxed text-text-main/85 2xl:max-w-2xl 2xl:text-base">
                            {dict.hero.description}
                        </p>
                        <a href="#contact" data-ga-event="cta_click" data-ga-cta-id="hero_project" className="group relative mt-8 flex h-[60px] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-sm border-heavy bg-transparent transition-colors duration-300 hover:bg-text-heavy lg:mt-10">
                            <span className="font-mono text-[14px] font-bold uppercase text-text-heavy transition-colors duration-300 group-hover:text-background-light">
                                {dict.hero.cta}
                            </span>
                        </a>
                    </div>
                </div>

                {/* Sheet notes - answers the first questions a buyer actually has. */}
                <div className="relative z-10 mx-auto mt-10 flex w-full max-w-[1800px] flex-col gap-6 border-t border-text-heavy/20 pt-5 sm:flex-row sm:items-end sm:justify-between">
                    <dl className="grid w-full grid-cols-2 gap-x-8 gap-y-5 font-mono sm:flex sm:w-auto sm:gap-x-12">
                        {SPECS.map((s) => (
                            <div key={s.k} className="flex flex-col gap-1.5">
                                <dt className="text-[9px] uppercase tracking-[0.3em] text-text-heavy/40">{s.k}</dt>
                                <dd className="text-sm uppercase tracking-wide text-text-heavy">{s.v}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="hidden shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-text-heavy/50 sm:flex">
                        <span>Scroll</span>
                        <span className="material-symbols-outlined animate-pulse text-sm">south</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
