import type { TypeIllustration } from "@/lib/catalog/types";

export default function TypeDrawing({ kind = "cover" }: { kind?: TypeIllustration }) {
  return <svg viewBox="0 0 400 250" fill="none" aria-hidden="true" className="h-full w-full" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
    <g opacity=".15"><path d="M20 50H380M20 100H380M20 150H380M20 200H380M50 20V230M100 20V230M150 20V230M200 20V230M250 20V230M300 20V230M350 20V230" /></g>
    {kind === "box" ? <g><path d="m105 120 90-40 100 40-90 48-100-48Zm0 0v55l100 48 90-48v-55M205 168v55M105 113l-10-63 95-30 5 60M95 50l100 30" /><ellipse cx="200" cy="121" rx="28" ry="13" /><path d="m195 102-13-24 16 5 20 22" /></g>
      : kind === "print" ? <g><path d="m110 58 170 22-25 137-170-22 25-137Zm8-12 170 22-25 137M126 34l170 22-25 137M140 96l105 14M136 117l105 14M132 138l70 10M128 159l95 13" /></g>
      : kind === "holder" ? <g><path d="M90 65h87l20 18h115v122H90V65Zm0 70 222-20M105 128V48h166v70M120 62h136M120 77h136M120 92h100" /><path d="M90 205h222" /></g>
      : kind === "notebook" ? <g><path d="m127 42 158 25v145l-158-25V42Zm0 0-14 8v145l158 25 14-8M127 187l-14 8M153 46v145M182 91l72 11M182 105l45 7M272 66v145" /><path d="m176 196 0 27 12-7 12 11v-27" /></g>
      : <g><path d="m68 63 126 26 138-26v134l-138 27-126-27V63Zm126 26v135M201 91v128M77 74l110 22v117L77 189V74Zm132 22 113-22v115l-113 24V96Z" />
        {kind === "menu" ? <><path d="m103 107 58 12M103 119l58 12M103 143l58 12M103 155l58 12M232 119l58-12M232 131l58-12M232 155l58-12M232 167l58-12" /><circle cx="197" cy="116" r="3" /><circle cx="197" cy="180" r="3" /></> : <><path d="m225 110 13-3-13 20v-17Zm78-15-13 3 13 14V95Zm-78 86 13 14-13 3v-17Zm78-15-13 20 13-3v-17Z" /><path d="m248 140 35-7M248 150l35-7" /></>}
      </g>}
    <g opacity=".5" strokeDasharray="3 5"><path d="M50 235H350M45 225v20M355 225v20M350 40v175" /></g>
    <g stroke="#D8412F"><path d="M25 25h12M31 19v12M363 225h12M369 219v12" /></g>
  </svg>;
}
