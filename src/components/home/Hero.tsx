import Image from "next/image";
import kokeniLogo from "../../../public/logo/kokeni_logo.svg";
import type { Dictionary } from "@/utils/getDictionary";

export default function Hero({ dict }: { dict: Dictionary }) {
    return (
        <section className="relative flex min-h-screen w-full flex-col px-10 py-10 lg:px-16 lg:py-16">
            {/* Registration Marks (Top Left) */}
            <div className="absolute top-8 left-8 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-text-heavy text-base">add</span>
                <span className="font-mono text-xs">X:001</span>
            </div>
            {/* Registration Marks (Top Right) */}
            <div className="absolute top-8 right-8 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-text-heavy text-base">add</span>
                <span className="font-mono text-xs">Y:001</span>
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

                {/* Right Side: Colchian Sketch SVG */}
                <div className="sketch-container relative mt-16 flex items-center justify-center lg:mt-0 lg:w-2/5">
                    {/* Bounding Box Tooltip (Revealed on hover) */}
                    <div className="bounding-box absolute inset-[-20px] z-20 flex flex-col justify-between p-2 pointer-events-none rounded-sm">
                        <div className="flex justify-between w-full">
                            <div className="h-2 w-2 border-l border-t border-primary"></div>
                            <span className="font-mono text-[12px] text-primary">W: 450mm</span>
                            <div className="h-2 w-2 border-r border-t border-primary"></div>
                        </div>
                        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 rotate-90">
                            <span className="font-mono text-[12px] text-primary">H: 450mm</span>
                        </div>
                        <div className="flex justify-between w-full">
                            <div className="h-2 w-2 border-l border-b border-primary"></div>
                            <div className="h-2 w-2 border-r border-b border-primary"></div>
                        </div>
                    </div>

                    {/* Abstract Geometric Wireframe (Colchian inspired) */}
                    <svg className="sketch-svg h-[400px] w-[400px] text-text-heavy lg:h-[500px] lg:w-[500px]" fill="none" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                        <g stroke="currentColor" strokeLinejoin="bevel" strokeWidth="2">
                            <path className="path-draw" d="M250 50 L423.2 150 L423.2 350 L250 450 L76.8 350 L76.8 150 Z"></path>
                            <path className="path-draw" d="M250 50 L250 450"></path>
                            <path className="path-draw" d="M76.8 150 L423.2 350"></path>
                            <path className="path-draw" d="M76.8 350 L423.2 150"></path>
                            <path className="path-draw" d="M250 150 L336.6 250 L250 350 L163.4 250 Z"></path>
                            <circle className="path-draw" cx="250" cy="250" r="40" strokeWidth="1.5"></circle>
                            <circle className="path-draw" cx="250" cy="250" r="20" strokeWidth="1"></circle>
                            <path className="path-draw" d="M250 50 L270 70 L270 430 L250 450" strokeDasharray="4 4" strokeWidth="1"></path>
                            <path className="path-draw" d="M423.2 150 L403.2 170 L403.2 330 L423.2 350" strokeDasharray="4 4" strokeWidth="1"></path>
                            <path className="path-draw" d="M76.8 150 L96.8 170 L96.8 330 L76.8 350" strokeDasharray="4 4" strokeWidth="1"></path>
                        </g>
                    </svg>
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
        </section>
    );
}
