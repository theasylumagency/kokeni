import Image from "next/image";
import type { Dictionary } from "@/utils/getDictionary";

export default function Capacity({ dict }: { dict: Dictionary }) {
  return (
    <section className="flex flex-col lg:flex-row min-h-screen w-full border-t border-text-heavy">
      {/* Left Column (The Machine) */}
      <div className="flex w-full lg:w-1/2 flex-col border-b lg:border-b-0 lg:border-r border-text-heavy">
        <div className="relative h-[50vh] lg:h-[70vh] w-full overflow-hidden bg-text-heavy">
          <Image
            src="/images/home/kokeni-printing-lab.webp"
            alt="The Machine"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col p-10 lg:p-16 flex-grow bg-background-light">
          <h2 className="font-display text-xl font-bold uppercase mb-6">{dict.capacity.title1}</h2>
          <p className="font-mono text-base leading-relaxed max-w-lg">
            {dict.capacity.desc1}
          </p>
        </div>
      </div>

      {/* Right Column (The Hand) */}
      <div className="flex w-full lg:w-1/2 flex-col">
        <div className="relative h-[50vh] lg:h-[70vh] w-full overflow-hidden bg-text-heavy">
          <Image
            src="/images/home/genuine-leather-notebook.webp"
            alt="The Atelier"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col p-10 lg:p-16 flex-grow bg-background-light">
          <h2 className="font-display text-xl font-bold uppercase mb-6">{dict.capacity.title2}</h2>
          <p className="font-mono text-base leading-relaxed max-w-lg">
            {dict.capacity.desc2}
          </p>
        </div>
      </div>
    </section>
  );
}
