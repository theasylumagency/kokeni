import Image from "next/image";

export default function Output({ dict }: { dict: any }) {
  return (
    <section className="flex flex-col w-full border-t border-text-heavy">
      {/* Part 1: The Atmosphere */}
      <div className="relative w-full h-full bg-text-heavy overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter contrast-125 opacity-70"
        >
          <source src="/videos/kokeni-web.mp4" type="video/mp4" />
          <source src="/videos/kokeni-web.webm" type="video/webm" />
          {/* Fallback image if video fails to load or no video exists yet */}
        </video>
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
      </div>

      {/* Part 2: The Grid (3 columns) */}
      <div className="m-12 grid grid-cols-1 lg:grid-cols-3">

        {/* Column 1 */}
        <div className="flex flex-col p-8 lg:p-3 pb-20">
          <div className="relative w-full aspect-square mb-8 overflow-hidden bg-text-main">
            <Image src="/images/home/home-section.webp" alt="Institutional" fill className="object-cover filter grayscale" />
          </div>
          <h3 className="font-mono text-lg font-bold mb-2 uppercase">{dict.output.inst_title}</h3>
          <p className="font-bold mb-4 uppercase text-sm">{dict.output.inst_subtitle}</p>
          <p className="font-display text-sm leading-relaxed text-text-main/80">{dict.output.inst_desc}</p>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col p-8 lg:p-3 pb-20">
          <div className="relative w-full aspect-square mb-8 overflow-hidden bg-text-main">
            <Image src="/images/home/home-section.webp" alt="Hospitality" fill className="object-cover filter grayscale" />
          </div>
          <h3 className="font-mono text-lg font-bold mb-2 uppercase">{dict.output.hosp_title}</h3>
          <p className="font-bold mb-4 uppercase text-sm">{dict.output.hosp_subtitle}</p>
          <p className="font-display text-sm leading-relaxed text-text-main/80">{dict.output.hosp_desc}</p>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col p-8 lg:p-3 pb-20">
          <div className="relative w-full aspect-square mb-8 overflow-hidden bg-text-main">
            <Image src="/images/home/home-section.webp" alt="Bespoke" fill className="object-cover filter grayscale" />
          </div>
          <h3 className="font-mono text-lg font-bold mb-2 uppercase">{dict.output.bespoke_title}</h3>
          <p className="font-bold mb-4 uppercase text-sm">{dict.output.bespoke_subtitle}</p>
          <p className="font-display text-sm leading-relaxed text-text-main/80">{dict.output.bespoke_desc}</p>
        </div>

      </div>
    </section>
  );
}
