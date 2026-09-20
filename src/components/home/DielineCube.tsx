"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
   The hero drawing has three states, in this order:

   1. LOAD    the cube plots itself stroke by stroke (like a pen
              plotter), then the dimension frame arrives 0.3s later.
   2. HOVER   annotation callouts fade in. Nothing is removed - taking
              information away on hover reads as a bug.
   3. SCROLL  the cube unfolds into the flat die-line of a cover
              (back panel | spine | front panel), scrubbed to scroll
              position, and the emboss target lands on the front panel.

   Every face is a 4-point quad in a fixed rotational order, so the
   cube state and the flat state interpolate point-for-point.
   ------------------------------------------------------------------ */

type Quad = readonly (readonly [number, number])[];

// Isometric cube: three visible faces.
const CUBE = {
  back: [[146, 190], [250, 250], [250, 370], [146, 310]],
  spine: [[250, 130], [354, 190], [250, 250], [146, 190]],
  front: [[250, 250], [354, 190], [354, 310], [250, 370]],
} as const satisfies Record<string, Quad>;

// Unfolded die-line: back panel | spine | front panel.
const FLAT = {
  back: [[90, 180], [210, 180], [210, 320], [90, 320]],
  spine: [[210, 180], [290, 180], [290, 320], [210, 320]],
  front: [[290, 180], [410, 180], [410, 320], [290, 320]],
} as const satisfies Record<string, Quad>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const quadPath = (from: Quad, to: Quad, t: number) =>
  from
    .map((point, i) => {
      const x = lerp(point[0], to[i][0], t).toFixed(2);
      const y = lerp(point[1], to[i][1], t).toFixed(2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ") + " Z";

// Dimension frame follows the silhouette as it flattens.
const BOX_CUBE = { x0: 146, y0: 130, x1: 354, y1: 370 };
const BOX_FLAT = { x0: 90, y0: 180, x1: 410, y1: 320 };

const ANNOTATIONS = [
  { y: 148, label: "MAT. / FULL-GRAIN LEATHER" },
  { y: 168, label: "PROC. / BLIND DEBOSS" },
  { y: 188, label: "FOIL / AU 24K" },
];

export default function DielineCube() {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    // On phones the hero is stacked and a scrubbed morph is both jarring
    // and expensive - the drawing stays a cube there.
    if (reduced || narrow) return;

    const read = () => {
      frame.current = null;
      const span = window.innerHeight * 0.55;
      const next = Math.min(1, Math.max(0, window.scrollY / span));
      setProgress(Math.round(next * 100) / 100);
    };

    const onScroll = () => {
      if (frame.current === null) frame.current = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  const t = progress;
  // The 3D-only ornament leaves early and the flat-only annotation arrives
  // late, so the middle of the morph stays a clean drawing rather than a
  // pile of half-relevant marks.
  const solid = Math.max(0, 1 - t * 3);
  const flat = Math.min(1, Math.max(0, (t - 0.55) / 0.4));

  const box = {
    x0: lerp(BOX_CUBE.x0, BOX_FLAT.x0, t),
    y0: lerp(BOX_CUBE.y0, BOX_FLAT.y0, t),
    x1: lerp(BOX_CUBE.x1, BOX_FLAT.x1, t),
    y1: lerp(BOX_CUBE.y1, BOX_FLAT.y1, t),
  };

  const markX = lerp(250, 350, t);
  const markY = lerp(250, 250, t);
  const markR = lerp(40, 28, t);

  return (
    <div className="dl-stage relative flex w-full items-center justify-center" tabIndex={-1}>
      <svg
        className="h-[340px] w-[340px] text-text-heavy sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px]"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Isometric cover unfolding into its flat die-line"
      >
        {/* --- Body: three panels ----------------------------------- */}
        <g stroke="currentColor" strokeWidth="2" strokeLinejoin="bevel">
          <path className="dl-draw" style={{ "--dl-delay": "0s" } as React.CSSProperties} d={quadPath(CUBE.back, FLAT.back, t)} />
          <path className="dl-draw" style={{ "--dl-delay": "0.12s" } as React.CSSProperties} d={quadPath(CUBE.spine, FLAT.spine, t)} />
          <path className="dl-draw" style={{ "--dl-delay": "0.24s" } as React.CSSProperties} d={quadPath(CUBE.front, FLAT.front, t)} />
        </g>

        {/* --- Material thickness: reads in 3D, folds away when flat -- */}
        <g stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity={Math.max(0, 1 - t * 2) * 0.5}>
          <path className="dl-draw" style={{ "--dl-delay": "0.36s" } as React.CSSProperties} d="M146 190 L138 196 L138 316 L146 310" />
          <path className="dl-draw" style={{ "--dl-delay": "0.44s" } as React.CSSProperties} d="M354 190 L362 196 L362 316 L354 310" />
          <path className="dl-draw" style={{ "--dl-delay": "0.52s" } as React.CSSProperties} d="M146 310 L250 370 L354 310" />
        </g>

        {/* --- Fold lines: only read when flat ----------------------- */}
        <g stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="6 5" opacity={flat}>
          <path d="M210 168 L210 332" />
          <path d="M290 168 L290 332" />
          <text x="250" y="352" textAnchor="middle" className="font-mono" fill="var(--color-primary)" fontSize="9" letterSpacing="1.5" stroke="none">
            FOLD
          </text>
        </g>

        {/* --- Emboss target: the thing this company actually sells -- */}
        <g stroke="currentColor" strokeWidth="1.5">
          <circle className="dl-draw" style={{ "--dl-delay": "0.6s" } as React.CSSProperties} cx={markX} cy={markY} r={markR} />
          <circle className="dl-draw" style={{ "--dl-delay": "0.68s" } as React.CSSProperties} cx={markX} cy={markY} r={markR / 2} strokeWidth="1" />
          <g opacity={solid}>
            <path className="dl-draw" style={{ "--dl-delay": "0.56s" } as React.CSSProperties} d="M250 150 L336.6 250 L250 350 L163.4 250 Z" strokeWidth="2" />
          </g>
          <g opacity={flat} stroke="var(--color-primary)">
            <path d={`M ${markX - markR - 12} ${markY} L ${markX + markR + 12} ${markY}`} strokeWidth="0.75" />
            <path d={`M ${markX} ${markY - markR - 12} L ${markX} ${markY + markR + 12}`} strokeWidth="0.75" />
            <text x={markX} y={markY + markR + 26} textAnchor="middle" className="font-mono" fill="var(--color-primary)" fontSize="9" letterSpacing="1.5" stroke="none">
              DEBOSS ⌀60
            </text>
          </g>
        </g>

        {/* --- Dimension frame: arrives after the drawing is done ---- */}
        <g className="dl-frame" stroke="var(--color-primary)" strokeWidth="1">
          <path d={`M ${box.x0 - 18} ${box.y0 - 18} L ${box.x0 - 6} ${box.y0 - 18} M ${box.x0 - 18} ${box.y0 - 18} L ${box.x0 - 18} ${box.y0 - 6}`} />
          <path d={`M ${box.x1 + 18} ${box.y0 - 18} L ${box.x1 + 6} ${box.y0 - 18} M ${box.x1 + 18} ${box.y0 - 18} L ${box.x1 + 18} ${box.y0 - 6}`} />
          <path d={`M ${box.x0 - 18} ${box.y1 + 18} L ${box.x0 - 6} ${box.y1 + 18} M ${box.x0 - 18} ${box.y1 + 18} L ${box.x0 - 18} ${box.y1 + 6}`} />
          <path d={`M ${box.x1 + 18} ${box.y1 + 18} L ${box.x1 + 6} ${box.y1 + 18} M ${box.x1 + 18} ${box.y1 + 18} L ${box.x1 + 18} ${box.y1 + 6}`} />
          <path d={`M ${box.x0 - 18} ${box.y0 - 30} L ${box.x1 + 18} ${box.y0 - 30}`} strokeWidth="0.75" strokeDasharray="2 3" />
          <text x={(box.x0 + box.x1) / 2} y={box.y0 - 36} textAnchor="middle" className="font-mono" fill="var(--color-primary)" fontSize="10" letterSpacing="1" stroke="none">
            W: {Math.round(lerp(450, 690, t))}mm
          </text>
          <text x={box.x1 + 30} y={(box.y0 + box.y1) / 2} textAnchor="middle" className="font-mono" fill="var(--color-primary)" fontSize="10" letterSpacing="1" stroke="none" transform={`rotate(90 ${box.x1 + 30} ${(box.y0 + box.y1) / 2})`}>
            H: {Math.round(lerp(520, 300, t))}mm
          </text>
        </g>

        {/* --- Hover annotations: additive only --------------------- */}
        <g className="dl-frame" stroke="none">
          {ANNOTATIONS.map((note) => (
            <g key={note.label} className="dl-annotation">
              <path d={`M 20 ${note.y} L 92 ${note.y}`} stroke="var(--color-primary)" strokeWidth="0.75" />
              <circle cx="20" cy={note.y} r="2" fill="var(--color-primary)" />
              <text x="26" y={note.y - 5} className="font-mono" fill="currentColor" fontSize="9" letterSpacing="1.2">
                {note.label}
              </text>
            </g>
          ))}
        </g>

        {/* --- Title block: 37 years, where a drawing keeps it ------- */}
        <g className="dl-titleblock" stroke="var(--color-primary)" strokeWidth="0.75">
          <path d="M 300 430 L 480 430 L 480 482 L 300 482 Z" />
          <path d="M 300 448 L 480 448" />
          <path d="M 300 465 L 480 465" />
          <path d="M 404 448 L 404 482" />
          <g stroke="none" className="font-mono" fontSize="9" letterSpacing="1.2">
            <text x="308" y="443" fill="currentColor" className="text-text-heavy">
              KOKENI LLC · EST. 1989
            </text>
            <text x="308" y="460" fill="currentColor" className="text-text-heavy">
              DWG NO. 001
            </text>
            <text x="412" y="460" fill="currentColor" className="text-text-heavy">
              SCALE 1:1
            </text>
            <text x="308" y="477" fill="currentColor" className="text-text-heavy">
              TBILISI, GE
            </text>
            <text x="412" y="477" fill="var(--color-primary-ink)">
              REV. {t > 0.5 ? "B/FLAT" : "A/3D"}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
