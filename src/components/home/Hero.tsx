import Image from "next/image";
import kokeniMark from "../../../public/logo/just_man.svg";
import DielineCube from "./DielineCube";
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
    // The extra height on lg+ is the runway the drawing unfolds over: the hero
    // pins itself, the cube flattens into its die-line, then the page moves on.
    // Phones keep a plain one-screen hero - no pinning, no morph.
    return (
        <section className="relative w-full lg:min-h-[170vh]">
            <div className="sticky top-0 flex min-h-screen w-full flex-col px-10 py-10 lg:py-14 lg:pl-28 lg:pr-20">
                <SheetFrame />

                {/* Registration Marks (Top Left) */}
                <div className="absolute top-8 left-8 z-20 hidden flex-col items-center gap-2 lg:flex">
                    <span className="material-symbols-outlined text-primary text-base">add</span>
                    <span className="font-mono text-xs text-primary-ink">X:001</span>
                </div>
                {/* Registration Marks (Top Right) */}
                <div className="absolute top-8 right-8 z-20 hidden flex-col items-center gap-2 lg:flex">
                    <span className="material-symbols-outlined text-primary text-base">add</span>
                    <span className="font-mono text-xs text-primary-ink">Y:001</span>
                </div>

                {/* Left margin rail - fills the dead vertical strip beside the frame */}
                <div className="absolute left-14 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.35em] text-text-heavy/35 [writing-mode:vertical-rl] rotate-180">
                        Kokeni Mfg. · Sheet 01 of 05 · Drawn in Tbilisi
                    </span>
                </div>

                <div className="relative z-10 flex w-full flex-1 flex-col justify-center gap-8 pt-14 lg:flex-row lg:items-center lg:gap-10 lg:pt-0">
                    {/* Left: the headline is the anchor now, the mark is just a mark */}
                    <div className="flex flex-col lg:w-[58%] lg:pr-8">
                        <Image
                            src={kokeniMark}
                            alt="Kokeni"
                            width={160}
                            height={160}
                            className="mb-8 h-14 w-auto object-contain object-left lg:h-16"
                            priority
                            unoptimized
                        />
                        <h1 className="font-bold uppercase text-text-heavy tracking-tighter leading-[0.95] text-[clamp(2.25rem,4.4vw,4.25rem)] flex flex-col items-start text-balance">
                            <span>{dict.hero.title2}</span>
                            <span>{dict.hero.title3}</span>
                        </h1>
                        <p className="mt-10 font-bold text-lg lg:text-xl">{dict.hero.subtitle}</p>
                        <p className="mt-3 max-w-xl font-mono text-sm leading-relaxed text-text-main/85">
                            {dict.hero.description}
                        </p>
                        <button className="group relative mt-10 flex h-[60px] w-[260px] items-center justify-center overflow-hidden border-heavy bg-transparent rounded-sm transition-colors duration-300 hover:bg-text-heavy cursor-pointer">
                            <span className="font-mono text-[14px] font-bold text-text-heavy transition-colors duration-300 group-hover:text-background-light uppercase">
                                {dict.hero.cta}
                            </span>
                        </button>
                    </div>

                    {/* Right: the drawing that completes, then unfolds */}
                    <div className="relative flex items-center justify-center lg:w-[42%]">
                        <DielineCube />
                    </div>
                </div>

                {/* Sheet notes - kills the dead band at the foot of the hero and
                    answers the first three questions a buyer actually has. */}
                <div className="relative z-10 mt-10 flex flex-col gap-6 border-t border-text-heavy/20 pt-5 sm:flex-row sm:items-end sm:justify-between">
                    <dl className="grid w-full grid-cols-2 gap-x-8 gap-y-5 font-mono sm:flex sm:w-auto sm:gap-x-12">
                        {SPECS.map((s) => (
                            <div key={s.k} className="flex flex-col gap-1.5">
                                <dt className="text-[9px] uppercase tracking-[0.3em] text-text-heavy/40">{s.k}</dt>
                                <dd className="text-sm uppercase tracking-wide text-text-heavy">{s.v}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-text-heavy/50">
                        <span>Scroll</span>
                        <span className="material-symbols-outlined animate-pulse text-sm">south</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
