/* Sheet numbering, so the sections read as one drawing set rather than
   four unrelated blocks - and so the empty top corner of each section
   carries something. */

export default function SheetMark({
    n,
    name,
    tone = "ink",
    className = "",
}: {
    n: string;
    name: string;
    tone?: "ink" | "paper";
    className?: string;
}) {
    const text = tone === "ink" ? "text-text-heavy/35" : "text-white/35";
    const rule = tone === "ink" ? "bg-text-heavy/20" : "bg-white/20";

    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute z-20 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] ${text} ${className}`}
        >
            <span className={`h-px w-6 ${rule}`} />
            <span>
                Sheet {n} / {name}
            </span>
        </div>
    );
}
