"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ------------------------------------------------------------------
   The hero drawing tells the company line literally — design,
   prototype, manufacture — on one real object, a diploma cover:

   01 DESIGN       the flat pattern is plotted: back | spine | front,
                   weld seam, fold lines, crest placement, dimensions.
   02 PROTOTYPE    the sheet tilts into 3/4 view and the pattern folds
                   on its two fold lines into a closed cover (a white
                   mock-up: hidden lines disappear, form appears).
   03 MANUFACTURE  material goes on, the press comes down and leaves
                   the gold crest, the run stacks up underneath.

   Everything is computed from one clock `t` (seconds), so any moment
   can be rendered directly: the step buttons jump, reduced motion
   shows finished states, and the loop pauses off-screen.
   ------------------------------------------------------------------ */

type V3 = [number, number, number];
type Pt = [number, number];

// World units are millimetres of an A4 diploma cover.
const PW = 220; // panel width
const PH = 310; // panel height
const S = 12; // spine = closed thickness
const VB_W = 640;
const VB_H = 480;

const STEPS = [
  { start: 0, end: 3.6, rest: 3.4 },
  { start: 3.6, end: 6.6, rest: 6.4 },
  { start: 6.6, end: 14.4, rest: 11.2 },
] as const;
const LOOP = 14.4;
const FINAL = 11.2;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const mix = (a: string, b: string, x: number) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(lerp(v, pb[i], x)).toString(16).padStart(2, "0")).join("")}`;
};

type Camera = { yaw: number; pitch: number; scale: number; cx: number; cy: number; target: V3 };
function project(p: V3, cam: Camera): [number, number, number] {
  const x = p[0] - cam.target[0], y = p[1] - cam.target[1], z = p[2] - cam.target[2];
  const ca = Math.cos(cam.yaw), sa = Math.sin(cam.yaw);
  const x1 = x * ca - y * sa;
  const y1 = x * sa + y * ca;
  const cb = Math.cos(cam.pitch), sb = Math.sin(cam.pitch);
  const y2 = y1 * cb - z * sb;
  const z2 = y1 * sb + z * cb;
  return [cam.cx + x1 * cam.scale, cam.cy + y2 * cam.scale, z2];
}
const facing = (n: V3, cam: Camera) => {
  const [x, y, z] = n;
  const y1 = x * Math.sin(cam.yaw) + y * Math.cos(cam.yaw);
  return y1 * Math.sin(cam.pitch) + z * Math.cos(cam.pitch) > 0;
};
const path = (pts: Pt[], close = true) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("") + (close ? "Z" : "");
const perimeter = (pts: Pt[], close = true) => pts.reduce((sum, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return i === pts.length - 1 && !close ? sum : sum + Math.hypot(q[0] - p[0], q[1] - p[1]);
}, 0);

/** Geometry of the cover for fold angle phi (0 = flat, PI/2 = closed), lifted by dz. */
function cover(phi: number, dz = 0) {
  const hx = S / 2;
  const edge = (y: number): V3 => [hx - S * Math.cos(phi), y, -S * Math.sin(phi) + dz];
  const back = (d: number, y: number): V3 => { const e = edge(y); return [e[0] - d * Math.cos(2 * phi), y, e[2] - d * Math.sin(2 * phi)]; };
  const top = -PH / 2, bot = PH / 2;
  return {
    front: { pts: [[hx, top, dz], [hx + PW, top, dz], [hx + PW, bot, dz], [hx, bot, dz]] as V3[], n: [0, 0, 1] as V3 },
    spine: { pts: [edge(top), [hx, top, dz], [hx, bot, dz], edge(bot)] as V3[], n: [-Math.sin(phi), 0, Math.cos(phi)] as V3 },
    back: { pts: [back(PW, top), edge(top), edge(bot), back(PW, bot)] as V3[], n: [-Math.sin(2 * phi), 0, Math.cos(2 * phi)] as V3 },
    east: { pts: [[hx + PW, top, dz], [hx + PW, top, dz - S], [hx + PW, bot, dz - S], [hx + PW, bot, dz]] as V3[], n: [1, 0, 0] as V3 },
    south: { pts: [[hx, bot, dz], [hx + PW, bot, dz], [hx + PW, bot, dz - S], [hx, bot, dz - S]] as V3[], n: [0, 1, 0] as V3 },
    north: { pts: [[hx, top, dz], [hx, top, dz - S], [hx + PW, top, dz - S], [hx + PW, top, dz]] as V3[], n: [0, -1, 0] as V3 },
    /** A point on a panel, u across (0..PW from the spine), v down (0..PH). */
    onFront: (u: number, v: number): V3 => [hx + u, top + v, dz],
    onBack: (u: number, v: number): V3 => back(u, top + v),
  };
}

const INK = "#10181e";
const PAPER = "#fbfaf6";
const LINING = "#e9e4da";
const MATERIAL = "#1f2d38";
const MATERIAL_SIDE = "#16222b";
const MATERIAL_EDGE = "#2b3d4a";
const GOLD = "#c9a24e";
const RED = "var(--color-primary)";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches;
const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

export type HeroConstructionLabels = {
  steps: readonly string[];
  captions: readonly string[];
  pause: string;
  play: string;
  label: string;
};

export default function HeroConstruction({ labels }: { labels: HeroConstructionLabels }) {
  const [clockT, setT] = useState(0);
  const [restT, setRestT] = useState(FINAL);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  // Reduced motion: no clock, the finished state (or the step the visitor picked) is shown.
  const t = reduced ? restT : clockT;
  const clock = useRef({ origin: 0, offset: 0 });
  const raf = useRef<number | null>(null);
  const visible = useRef(true);
  const stage = useRef<HTMLElement>(null);

  const run = useCallback(() => {
    if (raf.current !== null) return;
    clock.current.origin = performance.now();
    const tick = (now: number) => {
      const next = (clock.current.offset + (now - clock.current.origin) / 1000) % LOOP;
      setT(next);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);
  const stop = useCallback(() => {
    if (raf.current === null) return;
    cancelAnimationFrame(raf.current);
    raf.current = null;
    clock.current.offset = (clock.current.offset + (performance.now() - clock.current.origin) / 1000) % LOOP;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || paused) { stop(); return; }
    const sync = () => { if (visible.current && !document.hidden) run(); else stop(); };
    sync();
    const timer = setInterval(sync, 400);
    document.addEventListener("visibilitychange", sync);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", sync); stop(); };
  }, [paused, reduced, run, stop]);

  const jump = (index: number) => {
    if (reduced) { setRestT(STEPS[index].rest); return; }
    const target = paused ? STEPS[index].rest : STEPS[index].start;
    stop();
    clock.current.offset = target;
    setT(target);
    if (!paused) run();
  };

  const scene = renderHeroFrame(t);
  const active = STEPS.findIndex(step => t >= step.start && t < step.end);

  return (
    <figure ref={stage} className="relative m-0 flex w-full flex-col">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-auto w-full max-h-[calc(100svh-15rem)] text-text-heavy" role="img" aria-label={labels.label} fill="none" strokeLinejoin="round" strokeLinecap="round">
        {scene}
      </svg>
      {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? labels.play : labels.pause} title={paused ? labels.play : labels.pause}
        className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-sm border border-text-heavy/20 bg-background-light/80 text-text-heavy/70 transition-colors hover:border-text-heavy hover:text-text-heavy">
        <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" fill="currentColor">{paused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}</svg>
      </button>}
      <figcaption className="mt-4 border-t border-text-heavy/20 pt-3">
        <ol className="grid grid-cols-3 gap-3 sm:gap-6">
          {labels.steps.map((label, index) => {
            const step = STEPS[index];
            const progress = index < active ? 1 : index === active ? seg(t, step.start, step.end - 0.2) : 0;
            return <li key={label}>
              <button type="button" onClick={() => jump(index)} aria-current={index === active ? "step" : undefined}
                className={`group flex w-full flex-col items-start gap-1.5 text-left transition-colors ${index === active ? "text-text-heavy" : "text-text-heavy/45 hover:text-text-heavy"}`}>
                <span className="relative block h-px w-full bg-text-heavy/15"><span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${progress * 100}%`, height: 2, top: -0.5 }} /></span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-primary-ink">0{index + 1}</span>
                <span className="text-[13px] font-bold uppercase leading-tight sm:text-base">{label}</span>
                <span className="hidden font-mono text-[11px] leading-snug text-text-main/70 sm:block">{labels.captions[index]}</span>
              </button>
            </li>;
          })}
        </ol>
      </figcaption>
    </figure>
  );
}

/** The whole drawing at time t. Pure: same t, same picture. */
function renderHeroFrame(t: number) {
  // --- clocks per phase ---------------------------------------------
  const out = 1 - seg(t, 13.8, 14.4); // loop fade
  const tilt = ease(seg(t, 3.75, 5.25));
  const fold = ease(seg(t, 4.05, 6.0));
  const solid = seg(t, 3.65, 4.05); // line drawing -> opaque mock-up
  const material = ease(seg(t, 6.65, 7.45));
  const press = t < 7.6 ? 0 : t < 8.05 ? easeOut(seg(t, 7.6, 8.05)) : t < 8.2 ? 1 : 1 - ease(seg(t, 8.2, 8.75));
  const pressOn = seg(t, 7.45, 7.65) * (1 - seg(t, 8.7, 9.0));
  const stamped = t >= 8.05 ? 1 : 0;
  const flash = t >= 8.05 ? 1 - seg(t, 8.05, 8.6) : 0;
  const run = seg(t, 8.9, 10.5);
  const designMarks = 1 - seg(t, 3.6, 3.9);

  // The camera looks at the middle of the flat sheet, then follows the closed cover (and the run under it).
  const FLAT_SCALE = 0.96;
  const cam: Camera = {
    yaw: lerp(0, -0.56, tilt),
    pitch: lerp(0, 0.86, tilt),
    // Mid-fold the back panel swings below the sheet; pull back a little so it stays in frame.
    scale: (FLAT_SCALE + 0.04 * tilt + 0.22 * fold * fold) * (1 - 0.24 * Math.sin(Math.PI * fold)),
    cx: VB_W / 2 - lerp(14, 0, tilt),
    cy: VB_H / 2 - lerp(22, 30, tilt),
    target: [lerp(0, S / 2 + PW / 2, fold), 0, lerp(0, -S / 2, fold) - lerp(0, (S + 3) * 1.6, ease(run))],
  };
  const P = (p: V3): Pt => { const q = project(p, cam); return [q[0], q[1]]; };
  const depth = (pts: V3[]) => pts.reduce((sum, p) => sum + project(p, cam)[2], 0) / pts.length;

  const phi = fold * Math.PI / 2;
  const geo = cover(phi);
  const closed = seg(fold, 0.9, 1);

  // --- colours through the phases ------------------------------------
  const faceFill = (outer: boolean, kind: "front" | "spine" | "back" | "wall") => {
    const paper = outer ? PAPER : LINING;
    const mat = kind === "wall" ? MATERIAL_EDGE : kind === "spine" ? MATERIAL_SIDE : outer ? MATERIAL : LINING;
    return mix(paper, mat, material);
  };
  const lineColor = mix(INK, "#0b1116", material);
  const seamColor = mix("#56636b", "#8fa1ae", material);

  // --- plotting progress (design) -----------------------------------
  const plot = {
    back: ease(seg(t, 0.2, 1.05)),
    spine: ease(seg(t, 0.75, 1.2)),
    front: ease(seg(t, 0.95, 1.8)),
    seam: seg(t, 1.5, 2.2),
    crest: seg(t, 1.85, 2.45),
    fold: seg(t, 2.05, 2.5),
    dims: seg(t, 2.3, 2.9),
  };

  type Face = { key: string; depth: number; node: React.ReactNode };
  const faces: Face[] = [];

  const panelFace = (key: "front" | "spine" | "back", progress: number, details?: React.ReactNode) => {
    const f = geo[key];
    const pts = f.pts.map(P);
    const outer = facing(f.n, cam);
    const len = perimeter(pts);
    faces.push({
      key, depth: depth(f.pts) + (key === "front" ? 0.01 : 0),
      node: <g key={key}>
        <path d={path(pts)} fill={faceFill(outer, key)} fillOpacity={solid} stroke={lineColor} strokeWidth={1.6}
          strokeDasharray={progress < 1 ? `${len} ${len}` : undefined} strokeDashoffset={progress < 1 ? len * (1 - progress) : undefined} />
        {details}
      </g>,
    });
  };

  // Seam = the weld line 9 mm inside each panel edge.
  const inset = (on: (u: number, v: number) => V3, w: number) => [on(9, 9), on(w - 9, 9), on(w - 9, PH - 9), on(9, PH - 9)].map(P);
  const frontSeam = inset(geo.onFront, PW);
  const backSeam = inset(geo.onBack, PW);
  const seamPath = (pts: Pt[]) => { const len = perimeter(pts); return { d: path(pts), len }; };

  // Crest + lettering on the front panel.
  const crestC = { u: PW / 2, v: 96 };
  const circle = (r: number, n = 40) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return P(geo.onFront(crestC.u + Math.cos(a) * r, crestC.v + Math.sin(a) * r)); });
  const text = (v: number, half: number) => [P(geo.onFront(PW / 2 - half, v)), P(geo.onFront(PW / 2 + half, v))];
  const crestParts = [circle(30), circle(21)];
  const letterParts = [text(160, 58), text(180, 40), text(198, 50)];

  const frontVisible = facing(geo.front.n, cam);
  const frontDetails = <g>
    {(() => { const s = seamPath(frontSeam); return <path d={s.d} stroke={seamColor} strokeWidth={1} strokeDasharray="4 3" opacity={plot.seam} />; })()}
    {/* Design: red placement marks. Manufacture: the gold stamp. */}
    <g stroke={RED} strokeWidth={1} opacity={plot.crest * (1 - material) * (frontVisible ? 1 : 0)} strokeDasharray="3 3">
      {crestParts.map((pts, i) => <path key={i} d={path(pts)} />)}
      {letterParts.map((pts, i) => <path key={`l${i}`} d={path(pts, false)} />)}
    </g>
    <g stroke={GOLD} opacity={stamped * (frontVisible ? 1 : 0)}>
      {crestParts.map((pts, i) => <path key={i} d={path(pts)} strokeWidth={i ? 1.4 : 2} />)}
      {(() => {
        const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; const r = i % 2 ? 6 : 14; return P(geo.onFront(crestC.u + Math.cos(a) * r, crestC.v + Math.sin(a) * r)); });
        return <path d={path(star)} fill={GOLD} stroke="none" />;
      })()}
      {letterParts.map((pts, i) => <path key={`l${i}`} d={path(pts, false)} strokeWidth={i === 0 ? 3.4 : 2} />)}
    </g>
    {flash > 0 && <path d={path(circle(30 + (1 - flash) * 26))} stroke={GOLD} strokeWidth={1.2} opacity={flash} />}
  </g>;
  const backDetails = <g>{(() => { const s = seamPath(backSeam); return <path d={s.d} stroke={seamColor} strokeWidth={1} strokeDasharray="4 3" opacity={plot.seam * (facing(geo.back.n, cam) ? 1 : 0)} />; })()}</g>;

  panelFace("back", plot.back, backDetails);
  panelFace("spine", plot.spine);
  panelFace("front", plot.front, frontDetails);
  if (closed > 0) {
    for (const key of ["east", "south", "north"] as const) {
      const f = geo[key];
      if (!facing(f.n, cam)) continue;
      faces.push({ key, depth: depth(f.pts) - 0.5, node: <path key={key} d={path(f.pts.map(P))} fill={faceFill(true, "wall")} fillOpacity={closed} stroke={lineColor} strokeWidth={1.6} strokeOpacity={closed} /> });
    }
  }
  faces.sort((a, b) => a.depth - b.depth);

  // --- the run: identical covers stacking underneath -------------------
  const copies = [3, 2, 1].map(k => {
    const appear = easeOut(seg(run, (k - 1) / 3, k / 3));
    if (appear <= 0) return null;
    const g = cover(Math.PI / 2, -(S + 3) * k);
    const shift = (1 - appear) * -90;
    const Q = (p: V3): Pt => P([p[0] + shift, p[1], p[2]]);
    return <g key={k} opacity={Math.min(1, appear * 3)}>
      {(["south", "east", "north", "front"] as const).filter(key => facing(g[key].n, cam)).map(key => <path key={key} d={path(g[key].pts.map(Q))} fill={key === "front" ? MATERIAL : MATERIAL_EDGE} stroke="#0b1116" strokeWidth={1.2} />)}
    </g>;
  });
  const count = Math.round(lerp(1, 50, run));

  // --- press ------------------------------------------------------------
  const pressNode = pressOn > 0 && (() => {
    const lift = lerp(150, 1.5, press);
    const r = 36;
    const ring = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; const p = geo.onFront(crestC.u + Math.cos(a) * r, crestC.v + Math.sin(a) * r); return P([p[0], p[1], p[2] + lift]); });
    const ringTop = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; const p = geo.onFront(crestC.u + Math.cos(a) * r, crestC.v + Math.sin(a) * r); return P([p[0], p[1], p[2] + lift + 26]); });
    const c = geo.onFront(crestC.u, crestC.v);
    const top = P([c[0], c[1], c[2] + lift + 26]);
    const sky = P([c[0], c[1], c[2] + 520]);
    const xs = ring.map(p => p[0]);
    const left = Math.min(...xs), right = Math.max(...xs);
    const yAt = (pts: Pt[], x: number) => pts.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best)[1];
    return <g opacity={pressOn}>
      <path d={`M${top[0]} ${top[1]}L${sky[0]} ${sky[1]}`} stroke={INK} strokeWidth={6} opacity={0.85} />
      <path d={`M${left} ${yAt(ringTop, left)}L${left} ${yAt(ring, left)}M${right} ${yAt(ringTop, right)}L${right} ${yAt(ring, right)}`} stroke={INK} strokeWidth={1.4} />
      <path d={path(ring)} fill="#3a4a55" stroke={INK} strokeWidth={1.4} />
      <path d={path(ringTop)} fill="#56666f" stroke={INK} strokeWidth={1.4} />
      <text x={left - 14} y={yAt(ringTop, left) - 26} textAnchor="end" fontSize={10} letterSpacing={1.4} fill={RED} className="font-mono">FOIL PRESS</text>
    </g>;
  })();

  // --- design annotations (flat sheet only) ------------------------------
  const flatX = (x: number) => VB_W / 2 - 14 + x * FLAT_SCALE;
  const flatY = (y: number) => VB_H / 2 - 22 + y * FLAT_SCALE;
  const L = flatX(-S / 2 - PW), R = flatX(S / 2 + PW), T = flatY(-PH / 2), B = flatY(PH / 2);
  const sL = flatX(-S / 2), sR = flatX(S / 2);
  const tick = (x: number, y: number) => `M${x - 4} ${y + 4}L${x + 4} ${y - 4}`;
  const dimsOpacity = plot.dims * designMarks;
  const annotations = <g opacity={designMarks}>
    <g stroke={RED} strokeWidth={0.9} strokeDasharray="16 4 2 4" opacity={plot.fold}>
      <path d={`M${sL} ${T - 26}V${B + 26}M${sR} ${T - 26}V${B + 26}`} />
    </g>
    <g opacity={plot.fold} fill={RED} fontSize={9.5} letterSpacing={1.6} className="font-mono">
      <text x={sL - 8} y={T - 12} textAnchor="end">FOLD ×2</text>
    </g>
    <g opacity={dimsOpacity} stroke={RED} strokeWidth={0.9} fill="none">
      <path d={`M${sR} ${T - 6}V${T - 38}M${R} ${T - 6}V${T - 38}M${sR - 8} ${T - 30}H${R + 8}${tick(sR, T - 30)}${tick(R, T - 30)}`} />
      <path d={`M${R + 6} ${T}H${R + 38}M${R + 6} ${B}H${R + 38}M${R + 30} ${T - 8}V${B + 8}${tick(R + 30, T)}${tick(R + 30, B)}`} />
      <path d={`M${L} ${B + 6}V${B + 60}M${R} ${B + 6}V${B + 60}M${L - 8} ${B + 52}H${R + 8}${tick(L, B + 52)}${tick(R, B + 52)}`} />
    </g>
    <g opacity={dimsOpacity} fill={RED} fontSize={10.5} letterSpacing={1.4} className="font-mono">
      <text x={(sR + R) / 2} y={T - 36} textAnchor="middle">{PW}</text>
      <text x={R + 44} y={(T + B) / 2} textAnchor="middle" transform={`rotate(90 ${R + 44} ${(T + B) / 2})`}>{PH}</text>
      <text x={(L + R) / 2} y={B + 46} textAnchor="middle">{PW * 2 + S}</text>
    </g>
    <g opacity={plot.crest * designMarks} stroke={RED} strokeWidth={0.8}>
      {(() => { const c = P(geo.onFront(crestC.u, crestC.v)); return <path d={`M${c[0] - 50} ${c[1]}H${c[0] + 50}M${c[0]} ${c[1] - 50}V${c[1] + 50}`} />; })()}
    </g>
    <g opacity={plot.crest * designMarks} fill={RED} fontSize={9.5} letterSpacing={1.4} className="font-mono">
      {(() => { const c = P(geo.onFront(crestC.u, crestC.v)); return <text x={c[0] + 42} y={c[1] - 40}>⌀60 FOIL</text>; })()}
    </g>
  </g>;

  // --- title block ---------------------------------------------------------
  const phaseName = t < STEPS[1].start ? "REV A DESIGN" : t < STEPS[2].start ? "REV B PROTO" : "REV C PROD";
  const titleBlock = <g className="font-mono" fontSize={8.5} letterSpacing={1}>
    <g stroke={RED} strokeWidth={0.75} fill="none">
      <path d="M414 426H634V472H414Z M414 441H634 M414 456H634 M540 441V472" />
    </g>
    <text x={421} y={437} fill="currentColor">KOKENI LLC · EST. 1989</text>
    <text x={421} y={452} fill="currentColor">DWG 001 · A4 COVER</text>
    <text x={547} y={452} fill="currentColor">SCALE 1:4</text>
    <text x={421} y={467} fill="currentColor">TBILISI, GEORGIA</text>
    <text x={547} y={467} fill={RED}>{phaseName}</text>
  </g>;

  return <>
    <g opacity={out}>
      {copies}
      {faces.map(face => face.node)}
      {pressNode}
      {annotations}
      {run > 0 && <g className="font-mono" fill={RED} fontSize={11} letterSpacing={1.6} opacity={seg(run, 0, 0.2)}>
        {(() => { const p = P(cover(Math.PI / 2, -(S + 3) * 2).onFront(PW, PH)); return <text x={p[0] + 18} y={p[1] + 6}>QTY {String(count).padStart(3, "0")}</text>; })()}
      </g>}
    </g>
    {titleBlock}
  </>;
}
