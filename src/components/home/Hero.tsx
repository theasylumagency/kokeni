import Image from "next/image";
import kokeniLogo from "../../../public/logo/kokeni_logo.svg";
import DielineCube from "./DielineCube";
import type { Dictionary } from "@/utils/getDictionary";

export default function Hero({ dict }: { dict: Dictionary }) {
    // The extra height on lg+ is the runway the drawing unfolds over: the hero
    // pins itself, the cube flattens into its die-line, then the page moves on.
    // Phones keep a plain one-screen hero - no pinning, no morph.
    return (
        <section className="relative w-full lg:min-h-[170vh]">
            <div className="sticky top-0 flex min-h-screen w-full flex-col px-10 py-10 lg:px-16 lg:py-16">
                {/* Registration Marks (Top Left) */}
                <div className="absolute top-8 left-8 flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">add</span>
                    <span className="font-mono text-xs text-primary-ink">X:001</span>
                </div>
                {/* Registration Marks (Top Right) */}
                <div className="absolute top-8 right-8 flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">add</span>
                    <span className="font-mono text-xs text-primary-ink">Y:001</span>
                </div>

                <div className="flex h-full w-full flex-col justify-between pt-12 lg:flex-row lg:items-center lg:justify-between lg:pt-0 pb-10 mt-auto mb-auto">
                    {/* Left Side: Massive Typography & CTA */}
                    <div className="flex flex-col gap-12 lg:w-3/5 lg:pr-12">
                        <h1 className="font-bold text-[clamp(1rem,2vw,2rem)] break-words text-text-heavy uppercase tracking-tighter leading-none flex flex-col items-start">
                            <Image src={kokeniLogo} alt="Kokeni" width={800} height={240} className="w-auto h-[clamp(6rem,11vw,11rem)] object-contain object-left mb-6" priority unoptimized />
                            <span>{dict.hero.title2}</span>
                            <span>{dict.hero.title3}</span>
                        </h1>
                        <div className="mt-4">
                            <p className="font-bold text-lg mb-2">{dict.hero.subtitle}</p>
                            <p className="font-mono text-sm max-w-md mb-8">{dict.hero.description}</p>
                            <button className="group relative flex h-[60px] w-[240px] items-center justify-center overflow-hidden border-heavy bg-transparent rounded-sm transition-colors duration-300 hover:bg-text-heavy cursor-pointer">
                                <span className="font-mono text-[14px] font-bold text-text-heavy transition-colors duration-300 group-hover:text-background-light uppercase">
                                    {dict.hero.cta}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Right Side: the drawing that completes, then unfolds */}
                    <div className="relative mt-16 flex items-center justify-center lg:mt-0 lg:w-2/5">
                        <DielineCube />
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 z-20 opacity-80 animate-pulse">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-heavy">
                        Scroll
                    </span>
                    <span className="material-symbols-outlined text-text-heavy text-sm">
                        south
                    </span>
                </div>
            </div>
        </section>
    );
}
