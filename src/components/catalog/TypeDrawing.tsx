import type { ReactNode } from "react";
import type { TypeIllustration } from "@/lib/catalog/types";

/*
 * Technical drawings that mark each item type. One sheet language for all of them:
 *   - orthographic views (the object opened flat, or front + side), never loose perspective;
 *   - heavy outline for the object, thin lines for its parts;
 *   - a dashed inset line for the high-frequency weld seam — the construction Kokeni is built on;
 *   - red for everything that is annotation: centre lines, dimensions, format.
 * Formats are only printed where they are standard (A4, A5, ID-1, ID-3, 3×4 photo).
 * The drawing is decorative (aria-hidden); the name next to it carries the meaning.
 */

const W = 480;
const H = 320;

type P = { children?: ReactNode };
const Outline = ({ children }: P) => <g strokeWidth="1.6">{children}</g>;
const Detail = ({ children }: P) => <g strokeWidth="1" opacity=".8">{children}</g>;
const Seam = ({ children }: P) => <g strokeWidth=".9" strokeDasharray="3 2.5" opacity=".7">{children}</g>;
const Note = ({ children }: P) => <g className="dwg-note" stroke="var(--color-primary, #D8412F)" strokeWidth=".8">{children}</g>;

const rect = (x: number, y: number, w: number, h: number, r = 0) => <rect x={x} y={y} width={w} height={h} rx={r} />;
const lines = (x1: number, x2: number, y0: number, step: number, count: number, shorten: number[] = []) =>
  Array.from({ length: count }, (_, i) => <path key={i} d={`M${x1} ${y0 + i * step}H${x2 - (shorten[i % shorten.length] || 0)}`} />);

function Label({ x, y, children, anchor = "middle", rotate }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; rotate?: boolean }) {
  return <text x={x} y={y} textAnchor={anchor} fontSize="10" letterSpacing="1.2" fill="var(--color-primary, #D8412F)" stroke="none"
    style={{ fontFamily: "var(--font-mono, monospace)" }} transform={rotate ? `rotate(-90 ${x} ${y})` : undefined}>{children}</text>;
}

/** Dimension line with architectural ticks and extension lines. Horizontal when y1 === y2. */
function Dim({ x1, y1, x2, y2, at, label }: { x1: number; y1: number; x2: number; y2: number; at: number; label?: string }) {
  const horizontal = y1 === y2;
  const tick = (x: number, y: number) => `M${x - 3.5} ${y + 3.5}L${x + 3.5} ${y - 3.5}`;
  if (horizontal) {
    const dir = at < y1 ? -1 : 1;
    return <Note>
      <path d={`M${x1} ${y1 + dir * 4}V${at + dir * 5}M${x2} ${y2 + dir * 4}V${at + dir * 5}M${x1 - 6} ${at}H${x2 + 6}${tick(x1, at)}${tick(x2, at)}`} />
      {label && <Label x={(x1 + x2) / 2} y={at - 5}>{label}</Label>}
    </Note>;
  }
  const dir = at < x1 ? -1 : 1;
  return <Note>
    <path d={`M${x1 + dir * 4} ${y1}H${at + dir * 5}M${x2 + dir * 4} ${y2}H${at + dir * 5}M${at} ${y1 - 6}V${y2 + 6}${tick(at, y1)}${tick(at, y2)}`} />
    {label && <Label x={at + (dir > 0 ? 14 : -6)} y={(y1 + y2) / 2} rotate>{label}</Label>}
  </Note>;
}

/** Dash-dot centre line (fold axis, symmetry). */
const Centre = ({ x, y1, y2 }: { x: number; y1: number; y2: number }) =>
  <Note><path d={`M${x} ${y1}V${y2}`} strokeDasharray="14 3 2 3" /></Note>;

/** An opened bi-fold, seen from the inside: two panels, a spine, a welded rim. */
function Bifold({ x, y, w, h, spine, r = 3 }: { x: number; y: number; w: number; h: number; spine: number; r?: number }) {
  const inset = Math.max(4, Math.min(7, w * 0.045));
  return <>
    <Outline>{rect(x, y, w * 2 + spine, h, r)}</Outline>
    <Detail><path d={`M${x + w} ${y}V${y + h}M${x + w + spine} ${y}V${y + h}`} /></Detail>
    <Seam>{rect(x + inset, y + inset, w - inset * 2, h - inset * 2, 1.5)}{rect(x + w + spine + inset, y + inset, w - inset * 2, h - inset * 2, 1.5)}</Seam>
  </>;
}

function Diploma() {
  const x = 96, y = 64, w = 138, h = 196, s = 12, rx = x + w + s;
  const sx = rx + 16, sy = y + 16, sw = w - 32, sh = h - 32;
  const corner = (cx: number, cy: number, dx: number, dy: number) => <path d={`M${cx} ${cy}h${dx * 17}L${cx} ${cy + dy * 17}Z`} />;
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} />
    <Detail>
      {rect(sx, sy, sw, sh)}
      {corner(sx, sy, 1, 1)}{corner(sx + sw, sy, -1, 1)}{corner(sx, sy + sh, 1, -1)}{corner(sx + sw, sy + sh, -1, -1)}
      <circle cx={rx + w / 2} cy={sy + 36} r="11" /><circle cx={rx + w / 2} cy={sy + 36} r="6" />
      <path d={`M${rx + 38} ${sy + 64}H${rx + w - 38}`} strokeWidth="2" />
      {lines(rx + 30, rx + w - 30, sy + 80, 9, 4, [0, 10, 4, 22])}
      <path d={`M${sx + 12} ${sy + sh - 24}h26M${sx + sw - 38} ${sy + sh - 24}h26`} />
      {/* supplement pocket on the left panel */}
      <path d={`M${x + 7} ${y + h - 58}H${x + w / 2 - 12}a12 12 0 0 0 24 0H${x + w - 7}`} />
    </Detail>
    <Centre x={x + w + s / 2} y1={y - 18} y2={y + h + 18} />
    <Dim x1={rx} y1={y} x2={rx + w} y2={y} at={y - 22} label="A4" />
    <Dim x1={x + w * 2 + s} y1={y} x2={x + w * 2 + s} y2={y + h} at={x + w * 2 + s + 24} />
  </>;
}

function Credential() {
  const x = 118, y = 82, w = 116, h = 156, s = 8, rx = x + w + s;
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} />
    <Detail>
      {rect(x + 14, y + 20, 36, 48)}
      <circle cx={x + 50} cy={y + 66} r="15" strokeDasharray="2 2" />
      {lines(x + 58, x + w - 14, y + 26, 10, 4, [0, 8, 18, 4])}
      {lines(x + 14, x + w - 14, y + 96, 11, 4, [0, 20, 6, 34])}
      <path d={`M${rx + 16} ${y + 26}H${rx + w - 16}`} strokeWidth="2" />
      {lines(rx + 16, rx + w - 16, y + 44, 11, 5, [0, 14, 4, 26, 10])}
      <path d={`M${rx + 16} ${y + h - 30}h40`} />
      <circle cx={rx + w - 34} cy={y + h - 38} r="16" /><circle cx={rx + w - 34} cy={y + h - 38} r="11" strokeDasharray="1.5 2" />
    </Detail>
    <Note><path d={`M${x + 14} ${y + 20}L${x - 16} ${y - 6}H${x - 48}`} /></Note>
    <Label x={x - 50} y={y - 11} anchor="start">3×4</Label>
    <Centre x={x + w + s / 2} y1={y - 20} y2={y + h + 20} />
    <Dim x1={x} y1={y + h} x2={x + w} y2={y + h} at={y + h + 20} />
  </>;
}

function Certificate({ rings = false }: { rings?: boolean } = {}) {
  const x = 96, y = 64, w = 138, h = 196, s = 12, rx = x + w + s;
  const sx = rx + 12, sy = y + 12, sw = w - 24, sh = h - 24;
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} />
    <Detail>
      {/* transparent sleeve with the certificate inside */}
      {rect(sx, sy, sw, sh)}
      <path d={`M${sx + 10} ${sy + 34}L${sx + 34} ${sy + 10}M${sx + 10} ${sy + 48}L${sx + 48} ${sy + 10}`} opacity=".6" />
      {rect(sx + 8, sy + 8, sw - 16, sh - 16)}
      {rect(sx + 12, sy + 12, sw - 24, sh - 24)}
      {rings
        ? <><circle cx={rx + w / 2 - 6} cy={sy + 42} r="9" /><circle cx={rx + w / 2 + 6} cy={sy + 42} r="9" /></>
        : <circle cx={rx + w / 2} cy={sy + 42} r="9" />}
      <path d={`M${rx + 34} ${sy + 64}H${rx + w - 34}`} strokeWidth="2" />
      {lines(rx + 28, rx + w - 28, sy + 82, 10, 6, [0, 16, 6, 24, 2, 30])}
      {/* left panel: pocket with a thumb notch */}
      <path d={`M${x + 7} ${y + h - 58}H${x + w / 2 - 12}a12 12 0 0 0 24 0H${x + w - 7}`} />
    </Detail>
    <Centre x={x + w + s / 2} y1={y - 18} y2={y + h + 18} />
    <Dim x1={rx} y1={y} x2={rx + w} y2={y} at={y - 22} label="A4" />
  </>;
}

function Passport() {
  const x = 136, y = 88, w = 100, h = 142, s = 8, rx = x + w + s;
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} r={5} />
    <Detail>
      {/* side pockets that hold the passport's own cover */}
      <path d={`M${x + 24} ${y + 5}V${y + h - 5}M${rx + w - 24} ${y + 5}V${y + h - 5}`} />
      {/* passport data page */}
      {rect(rx + 10, y + 16, 34, 44)}
      {lines(rx + 50, rx + w - 30, y + 22, 9, 4, [0, 8, 14, 4])}
      {lines(x + 32, x + w - 10, y + 22, 11, 8, [0, 14, 6, 22, 0, 18, 8, 26])}
    </Detail>
    <text x={rx + 8} y={y + h - 26} fontSize="6.4" letterSpacing=".6" fill="currentColor" stroke="none" opacity=".7" style={{ fontFamily: "var(--font-mono, monospace)" }}>P&lt;GEO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    <text x={rx + 8} y={y + h - 16} fontSize="6.4" letterSpacing=".6" fill="currentColor" stroke="none" opacity=".7" style={{ fontFamily: "var(--font-mono, monospace)" }}>0000000&lt;0GEO&lt;&lt;&lt;</text>
    <Centre x={x + w + s / 2} y1={y - 20} y2={y + h + 20} />
    <Dim x1={rx} y1={y} x2={rx + w} y2={y} at={y - 22} label="ID-3" />
    <Dim x1={rx + w} y1={y} x2={rx + w} y2={y + h} at={rx + w + 24} />
  </>;
}

function Card() {
  const x = 138, y = 92, w = 204, h = 150;
  const cx = x + 17, cy = y + 30, cw = w - 34, ch = cw / 1.586;
  return <>
    <Outline>{rect(x, y, w, h, 12)}</Outline>
    <Detail>
      {rect(x + w / 2 - 22, y + 10, 44, 7, 3.5)}
      {/* window + card */}
      <path d={`M${x + 10} ${y + 24}H${x + w / 2 - 14}a14 14 0 0 0 28 0H${x + w - 10}`} />
      {rect(cx, cy, cw, ch, 6)}
      {rect(cx + 10, cy + 12, 30, 40)}
      {lines(cx + 50, cx + cw - 12, cy + 16, 9, 4, [0, 20, 8, 30])}
      {rect(cx + 50, cy + 60, 18, 14, 2)}
    </Detail>
    <Seam>{rect(x + 5, y + 5, w - 10, h - 10, 8)}</Seam>
    <Dim x1={cx} y1={cy + ch} x2={cx + cw} y2={cy + ch} at={y + h + 22} label="ID-1" />
    <Dim x1={x + w} y1={y} x2={x + w} y2={y + h} at={x + w + 24} />
  </>;
}

function Menu() {
  const x = 104, y = 50, w = 128, h = 214, s = 16, rx = x + w + s;
  const page = (px: number) => <>
    <path d={`M${px + 36} ${y + 26}H${px + w - 36}`} strokeWidth="2" />
    {Array.from({ length: 7 }, (_, i) => {
      const ly = y + 50 + i * 20;
      return <g key={i}><path d={`M${px + 16} ${ly}h${34 + (i % 3) * 8}`} /><path d={`M${px + 56 + (i % 3) * 8} ${ly}H${px + w - 32}`} strokeDasharray="1 3" /><path d={`M${px + w - 26} ${ly}h12`} /></g>;
    })}
  </>;
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} />
    <Detail>
      {page(x)}{page(rx)}
      {/* cord through the spine */}
      <path d={`M${x + w + s / 2} ${y - 6}V${y + h + 4}c0 10-8 14-12 22M${x + w + s / 2} ${y + h + 4}c0 10 8 14 12 22`} />
      <circle cx={x + w + s / 2} cy={y + h + 4} r="3" />
    </Detail>
    <Dim x1={rx} y1={y} x2={rx + w} y2={y} at={y - 22} label="A4" />
    <Dim x1={x} y1={y} x2={x} y2={y + h} at={x - 24} />
  </>;
}

function Receipt() {
  const x = 142, y = 54, w = 92, h = 208, s = 12, rx = x + w + s;
  const seg = (w - 24) / 16;
  const zig = Array.from({ length: 8 }, () => `l-${seg} 6l-${seg} -6`).join("");
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} />
    <Detail>
      {/* card pocket, left */}
      <path d={`M${x + 6} ${y + 130}H${x + w - 6}`} />
      <path d={`M${x + 18} ${y + 130}V${y + 103}a3 3 0 0 1 3 -3H${x + 71}a3 3 0 0 1 3 3V${y + 130}`} />
      <path d={`M${x + 18} ${y + 110}H${x + 74}`} strokeWidth="2.4" />
      {/* receipt, right: tucked under a corner strap */}
      <path d={`M${rx + 12} ${y + 16}H${rx + w - 12}V${y + 150}${zig}Z`} />
      {lines(rx + 22, rx + w - 22, y + 34, 12, 7, [0, 18, 8, 24, 4, 14, 0])}
      <path d={`M${rx + 22} ${y + 124}h24M${rx + w - 36} ${y + 124}h14`} strokeWidth="2" />
      <path d={`M${rx + 5} ${y + 44}L${rx + 44} ${y + 5}`} />
    </Detail>
    <Centre x={x + w + s / 2} y1={y - 18} y2={y + h + 18} />
    <Dim x1={rx + w} y1={y} x2={rx + w} y2={y + h} at={rx + w + 24} />
  </>;
}

function Waiter() {
  const x = 150, y = 56, w = 86, h = 204, s = 10, rx = x + w + s;
  return <>
    <Bifold x={x} y={y} w={w} h={h} spine={s} r={5} />
    <Detail>
      {/* pen held by an elastic loop, left */}
      {rect(x + w - 22, y + 24, 8, 146, 4)}
      <path d={`M${x + w - 18} ${y + 170}v10M${x + w - 14} ${y + 32}h4v44`} />
      <path d={`M${x + w - 28} ${y + 58}h20M${x + w - 28} ${y + 66}h20`} />
      {/* order pad, right, slid into the back-cover pocket */}
      <path d={`M${rx + 12} ${y + h - 44}V${y + 14}H${rx + w - 12}V${y + h - 44}`} />
      <path d={`M${rx + 6} ${y + h - 44}H${rx + w - 6}`} />
      <path d={`M${rx + 20} ${y + 28}h22`} strokeWidth="2" />
      <text x={rx + w - 18} y={y + 31} textAnchor="end" fontSize="7" fill="currentColor" stroke="none" style={{ fontFamily: "var(--font-mono, monospace)" }}>№ 0147</text>
      {lines(rx + 20, rx + w - 20, y + 44, 12, 10, [0, 12, 4, 20, 8, 0, 16, 6, 24, 10]).slice(0, 9)}
    </Detail>
    <Centre x={x + w + s / 2} y1={y - 18} y2={y + h + 18} />
    <Dim x1={x} y1={y} x2={x} y2={y + h} at={x - 24} />
  </>;
}

/** Closed notebook: front view + side view (page block). */
function Notebook() {
  const x = 118, y = 52, w = 150, h = 212, sx = 318, sw = 26;
  return <>
    <Outline>
      <path d={`M${x} ${y}H${x + w - 12}a12 12 0 0 1 12 12V${y + h - 12}a12 12 0 0 1 -12 12H${x}Z`} />
      <path d={`M${sx} ${y}H${sx + sw}V${y + h}H${sx}Z`} />
    </Outline>
    <Detail>
      <path d={`M${x + 14} ${y}V${y + h}`} />
      {/* elastic band */}
      <path d={`M${x + w - 22} ${y - 2}V${y + h + 2}M${x + w - 17} ${y - 2}V${y + h + 2}`} />
      {/* debossed logo */}
      {rect(x + 44, y + 64, 58, 34, 2)}
      {/* ribbon marker */}
      <path d={`M${x + 70} ${y + h}v22l5-6 5 6v-22`} />
      {/* side view: covers + page block */}
      <path d={`M${sx + 3} ${y + 3}V${y + h - 3}M${sx + sw - 3} ${y + 3}V${y + h - 3}`} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${sx + 6 + i * 1.8} ${y + 6}V${y + h - 6}`} opacity=".5" />)}
      <path d={`M${sx + sw + 1} ${y + 60}h4v60h-4`} />
    </Detail>
    <Seam><path d={`M${x + 20} ${y + 6}H${x + w - 16}a8 8 0 0 1 8 8V${y + h - 14}a8 8 0 0 1 -8 8H${x + 20}`} /></Seam>
    <Note><path d={`M${x + w + 10} ${y + h / 2}H${sx - 10}`} strokeDasharray="4 3" /></Note>
    <Dim x1={x} y1={y} x2={x + w} y2={y} at={y - 22} label="A5" />
    <Dim x1={sx} y1={y} x2={sx + sw} y2={y} at={y - 22} />
  </>;
}

function Spread({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  return <>
    <Outline><path d={`M${x + 12} ${y}H${x + w * 2 - 12}a12 12 0 0 1 12 12V${y + h - 12}a12 12 0 0 1 -12 12H${x + 12}a12 12 0 0 1 -12 -12V${y + 12}a12 12 0 0 1 12 -12Z`} /></Outline>
    <Detail>
      <path d={`M${x + w} ${y}V${y + h}`} />
      <path d={`M${x + w - 4} ${y + 2}V${y + h - 2}M${x + w + 4} ${y + 2}V${y + h - 2}`} opacity=".45" />
      {children}
    </Detail>
  </>;
}

function Diary() {
  const x = 90, y = 64, w = 150, h = 200;
  const page = (px: number, day: string) => <>
    <text x={px + 16} y={y + 42} fontSize="26" fill="currentColor" stroke="none" style={{ fontFamily: "var(--font-mono, monospace)" }}>{day}</text>
    <path d={`M${px + 58} ${y + 30}h46M${px + 58} ${y + 40}h30`} />
    {Array.from({ length: 11 }, (_, i) => <g key={i}>
      <text x={px + 16} y={y + 71 + i * 12} fontSize="6.5" fill="currentColor" stroke="none" opacity=".75" style={{ fontFamily: "var(--font-mono, monospace)" }}>{String(8 + i).padStart(2, "0")}</text>
      <path d={`M${px + 30} ${y + 69 + i * 12}H${px + w - 16}`} opacity=".7" />
    </g>)}
  </>;
  return <>
    <Spread x={x} y={y} w={w} h={h}>
      {page(x + 4, "12")}{page(x + w + 4, "13")}
      <path d={`M${x + w + 2} ${y}c8 70 -10 150 14 ${h + 26}l5 -7 5 5`} />
    </Spread>
    <Dim x1={x + w} y1={y} x2={x + w * 2} y2={y} at={y - 22} label="A5" />
  </>;
}

function Planner() {
  const x = 90, y = 64, w = 150, h = 200;
  const block = (bx: number, by: number, bw: number, bh: number, n: number) => <g key={n}>
    {rect(bx, by, bw, bh)}
    <text x={bx + 5} y={by + 11} fontSize="7.5" fill="currentColor" stroke="none" style={{ fontFamily: "var(--font-mono, monospace)" }}>{String(n).padStart(2, "0")}</text>
    {Array.from({ length: Math.floor((bh - 18) / 9) }, (_, i) => <path key={i} d={`M${bx + 5} ${by + 22 + i * 9}H${bx + bw - 5}`} opacity=".55" />)}
  </g>;
  const bh = (h - 32 - 8) / 3;
  return <>
    <Spread x={x} y={y} w={w} h={h}>
      {[0, 1, 2].map(i => block(x + 14, y + 16 + i * (bh + 4), w - 26, bh, i + 1))}
      {[0, 1, 2].map(i => block(x + w + 12, y + 16 + i * (bh + 4), i === 2 ? (w - 30) / 2 : w - 26, bh, i + 4))}
      {block(x + w + 12 + (w - 30) / 2 + 4, y + 16 + 2 * (bh + 4), (w - 30) / 2, bh, 7)}
    </Spread>
    <Dim x1={x} y1={y} x2={x + w * 2} y2={y} at={y - 22} />
  </>;
}

function Folder() {
  const x = 96, y = 62, w = 138, h = 198, s = 10, rx = x + w + s;
  return <>
    <Outline><path d={`M${x} ${y}H${x + w * 2 + s}V${y + h}H${x}Z`} /></Outline>
    <Detail>
      {/* capacity gusset */}
      <path d={`M${x + w} ${y}V${y + h}M${x + w + s / 2} ${y}V${y + h}M${x + w + s} ${y}V${y + h}`} />
      {/* documents standing in the right-hand pocket (hidden below its mouth) */}
      <path d={`M${rx + 16} ${y + 113}V${y + 14}H${rx + w - 14}V${y + 102}`} />
      <path d={`M${rx + 10} ${y + 114}V${y + 26}H${rx + w - 20}V${y + 103}`} />
      {lines(rx + 20, rx + w - 30, y + 42, 10, 5, [0, 16, 6, 24, 10])}
      {/* pocket with a slanted mouth and card slits */}
      <path d={`M${rx} ${y + 116}L${rx + w} ${y + 100}`} strokeWidth="1.3" />
      <path d={`M${rx + 20} ${y + 150}l12 -9M${rx + 58} ${y + 150}l-12 -9`} />
    </Detail>
    <Seam>
      {rect(x + 6, y + 6, w - 12, h - 12)}{rect(rx + 6, y + 6, w - 12, h - 12)}
    </Seam>
    <Centre x={x + w + s / 2} y1={y - 18} y2={y + h + 18} />
    <Dim x1={rx} y1={y} x2={rx + w} y2={y} at={y - 22} label="A4" />
    <Dim x1={x + w * 2 + s} y1={y} x2={x + w * 2 + s} y2={y + h} at={x + w * 2 + s + 24} />
  </>;
}

function Binder() {
  const x = 84, y = 62, w = 136, h = 198, s = 36, rx = x + w + s, cx = x + w + s / 2;
  const rings = [y + 42, y + 84, y + 114, y + 156];
  return <>
    <Outline>{rect(x, y, w * 2 + s, h, 3)}</Outline>
    <Detail>
      <path d={`M${x + w} ${y}V${y + h}M${x + w + s} ${y}V${y + h}`} />
      {rect(cx - 9, y + 22, 18, h - 44, 4)}
      {/* sheets with punched holes, on the rings */}
      {rect(rx + 6, y + 10, w - 16, h - 20)}
      {rect(rx + 2, y + 14, w - 16, h - 20)}
      {lines(rx + 26, rx + w - 22, y + 38, 12, 11, [0, 14, 6, 24, 2, 18, 8, 0, 20, 10, 4])}
    </Detail>
    <g strokeWidth="1.4">
      {rings.map(ry => <g key={ry}><path d={`M${cx - 4} ${ry}C${cx + 4} ${ry - 9} ${rx + 12} ${ry - 9} ${rx + 14} ${ry}`} /><circle cx={rx + 14} cy={ry} r="3.2" /></g>)}
    </g>
    <Seam>{rect(x + 6, y + 6, w - 12, h - 12)}</Seam>
    <Dim x1={x + w} y1={y + h} x2={x + w + s} y2={y + h} at={y + h + 22} />
    <Dim x1={rx} y1={y} x2={rx + w} y2={y} at={y - 22} label="A4" />
  </>;
}

/** Medal case: plan view, lid laid open above the base. */
function Box() {
  const x = 168, w = 144, lidY = 36, lidH = 110, y = lidY + lidH + 6, h = 132;
  const cx = x + w / 2, cy = y + h / 2 + 4;
  return <>
    <Outline>{rect(x, lidY, w, lidH, 10)}{rect(x, y, w, h, 10)}</Outline>
    <Detail>
      {rect(x + 10, lidY + 10, w - 20, lidH - 20, 5)}
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${x + 16 + i * 20} ${lidY + lidH - 12}l${Math.min(56, w - 36 - i * 20)} -${Math.min(56, w - 36 - i * 20)}`} opacity=".35" />)}
      {rect(x + 10, y + 10, w - 20, h - 20, 5)}
      <circle cx={cx} cy={cy} r="38" /><circle cx={cx} cy={cy} r="30" />
      <path d={`M${cx} ${cy - 20}l5 14h15l-12 9 5 15-13-9-13 9 5-15-12-9h15Z`} strokeWidth=".9" />
      {rect(cx - 14, y + 14, 28, 10, 1)}
    </Detail>
    <Note><path d={`M${x - 14} ${lidY + lidH + 3}H${x + w + 14}`} strokeDasharray="6 3" /></Note>
    <Dim x1={x} y1={y + h} x2={x + w} y2={y + h} at={y + h + 20} />
    <Dim x1={x + w} y1={y} x2={x + w} y2={y + h} at={x + w + 24} />
  </>;
}

const DRAWINGS: Record<TypeIllustration, () => ReactNode> = {
  diploma: Diploma, cover: Diploma, credential: Credential, certificate: Certificate, print: Certificate, marriage: () => <Certificate rings />,
  passport: Passport, card: Card, menu: Menu, receipt: Receipt, waiter: Waiter,
  notebook: Notebook, diary: Diary, planner: Planner, folder: Folder, holder: Folder, binder: Binder, box: Box,
};

export default function TypeDrawing({ kind = "diploma", className = "" }: { kind?: TypeIllustration; className?: string }) {
  const Drawing = DRAWINGS[kind] || Diploma;
  return <svg viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true" focusable="false" className={`dwg h-full w-full ${className}`}
    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <Drawing />
  </svg>;
}
