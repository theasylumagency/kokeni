/* ------------------------------------------------------------------
   The border of a drawing sheet: an outer rule, an inner rule, and a
   zone band between them (A-D down the sides, 1-6 across). An empty
   technical sheet never reads as unfinished, because the frame says
   "this is the whole sheet" - which is exactly what the hero needed.
   Decorative only: hidden from assistive tech, never takes pointer
   events, and drops out below md where the margins are too tight.
   ------------------------------------------------------------------ */

const COLS = ["1", "2", "3", "4", "5", "6"];
const ROWS = ["A", "B", "C", "D"];

export default function SheetFrame({ tone = "ink" }: { tone?: "ink" | "paper" }) {
    const line = tone === "ink" ? "border-text-heavy/20" : "border-white/20";
    const hair = tone === "ink" ? "border-text-heavy/10" : "border-white/10";
    const text = tone === "ink" ? "text-text-heavy/30" : "text-white/30";

    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute inset-4 z-0 hidden border md:block lg:inset-6 ${line}`}
        >
            {/* inner rule - the actual drawing area */}
            <div className={`absolute inset-6 border ${hair}`} />

            {/* zone band: top and bottom */}
            {(["top", "bottom"] as const).map((edge) => (
                <div
                    key={edge}
                    className={`absolute left-6 right-6 flex h-6 ${edge === "top" ? "top-0" : "bottom-0"}`}
                >
                    {COLS.map((c) => (
                        <div
                            key={c}
                            className={`relative flex flex-1 items-center justify-center border-r last:border-r-0 ${hair}`}
                        >
                            <span className={`font-mono text-[9px] tracking-[0.2em] ${text}`}>{c}</span>
                        </div>
                    ))}
                </div>
            ))}

            {/* zone band: left and right */}
            {(["left", "right"] as const).map((edge) => (
                <div
                    key={edge}
                    className={`absolute bottom-6 top-6 flex w-6 flex-col ${edge === "left" ? "left-0" : "right-0"}`}
                >
                    {ROWS.map((r) => (
                        <div
                            key={r}
                            className={`relative flex flex-1 items-center justify-center border-b last:border-b-0 ${hair}`}
                        >
                            <span className={`font-mono text-[9px] tracking-[0.2em] ${text}`}>{r}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
