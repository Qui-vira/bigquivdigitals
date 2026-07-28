/**
 * WCAG contrast check for the mobile hero copy. NOT part of the build.
 *
 *   node scripts/hero-contrast.mjs [width] [height] [mode]
 *   mode: "spec"  the requested left-to-right gradient, transparent at 100%
 *         "ship"  the shipped variant
 *
 * Samples the real plate at the real narrow fit, composites the scrim stack
 * over it, and reports the worst-case (brightest background) contrast behind
 * each text block. Worst case is the right measure: the copy sits over a face,
 * so the mean is optimistic and the bright cheek is what actually fails.
 *
 * Crucially it samples ACROSS each line, not just down, because a horizontal
 * gradient protects the start of a line far better than the end of it.
 */
import sharp from "sharp";

const PLATE_W = 2688, PLATE_H = 1520;
const SUBJECT_W = 1128, SUBJECT_CX = 0.512, FACE_CY = 0.403;
const TARGET = 0.9, CROWN = 0.1, SHOULDER = 0.9;
const FOCAL = Number(process.argv[5] ?? 0.42);
const BAND = SHOULDER - CROWN;

function narrowFit(cw, ch) {
  const cover = Math.max(cw / PLATE_W, ch / PLATE_H);
  const widthCap = (TARGET * cw) / SUBJECT_W;
  const heightCap = ch / (BAND * PLATE_H);
  const s = Math.min(cover, widthCap, heightCap);
  const dw = PLATE_W * s, dh = PLATE_H * s;
  return { s, dw, dh, dx: cw * 0.5 - SUBJECT_CX * dw, dy: ch * FOCAL - FACE_CY * dh };
}

const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const ramp = (stops) => (t) => {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [a0, v0] = [stops[i - 1][0], stops[i - 1][1]];
      const [a1, v1] = [stops[i][0], stops[i][1]];
      return v0 + (v1 - v0) * ((t - a0) / (a1 - a0));
    }
  }
  return stops[stops.length - 1][1];
};

/** Existing bottom scrim, lg:hidden, "to top" over the bottom 42%. */
function scrimAlpha(y) {
  const start = 0.58;
  if (y < start) return 0;
  const u = 1 - (y - start) / 0.42;
  if (u <= 0.34) return 1;
  if (u <= 0.62) return 1 + (0.72 - 1) * ((u - 0.34) / 0.28);
  return 0.72 * (1 - (u - 0.62) / 0.38);
}

const MODE = process.argv[4] ?? "spec";

// As requested: left-to-right, transparent at 100%.
const SPEC_X = ramp([[0, 0.88], [0.45, 0.75], [0.75, 0.45], [1, 0]]);
// Shipped: same shape and feel, but it never reaches zero, because the copy
// column is full width on mobile and headline lines run to ~93% of it.
const TAIL = Number(process.argv[6] ?? 0.62);
const SHIP_X = ramp([[0, 0.9], [0.45, 0.8], [0.75, TAIL + 0.12], [1, TAIL]]);
const horiz = MODE === "spec" ? SPEC_X : SHIP_X;

const CW = Number(process.argv[2] ?? 592);
const CH = Number(process.argv[3] ?? 800);
const f = narrowFit(CW, CH);
const { data, info } = await sharp("public/hero/king-base-1600.png")
  .resize(Math.round(f.dw), Math.round(f.dh), { fit: "fill" })
  .raw()
  .toBuffer({ resolveWithObject: true });

/** Worst composited contrast anywhere inside a text box. */
function worst(fg, yTop, yBot, xL, xR) {
  let out = null;
  for (let y = Math.round(yTop); y < Math.round(yBot); y += 2) {
    const py = Math.round(y - f.dy);
    for (let x = Math.round(xL); x < Math.round(xR); x += 3) {
      const px = Math.round(x - f.dx);
      let p = [0, 0, 0];
      if (py >= 0 && py < info.height && px >= 0 && px < info.width) {
        const o = (py * info.width + px) * info.channels;
        p = [data[o], data[o + 1], data[o + 2]];
      }
      // vertical mask on the horizontal layer: 0 at the top, full by 25%
      const m = Math.min(1, Math.max(0, (y / CH) / 0.25));
      const a = 1 - (1 - horiz(x / CW) * m) * (1 - scrimAlpha(y / CH));
      const bg = p.map((c) => c * (1 - a));
      const r = ratio(fg, bg);
      if (!out || r < out.r) out = { r, x, y, a };
    }
  }
  return out;
}

const hSize = Math.min(40, Math.max(28, CW * 0.075));
const top = Math.max(112, CH - 56 - 403);
const hEnd = top + 3 * hSize * 0.98;
// Headline is text-balance across the full column; body is capped at 46ch.
const bodyRight = Math.min(CW - 24, 24 + 46 * 16 * 0.4486);

const rows = [
  ["headline #F2EDE7", top, hEnd, 24, CW - 24, hex("#F2EDE7")],
  ["body     #F3F3F3", hEnd + 32, hEnd + 32 + 4 * 26, 24, bodyRight, hex("#F3F3F3")],
  ["proof    #F3F3F3", hEnd + 32 + 4 * 26 + 12, hEnd + 32 + 4 * 26 + 12 + 2 * 23, 24, bodyRight, hex("#F3F3F3")],
];

console.log(`${CW}x${CH}  mode=${MODE}  scale=${f.s.toFixed(4)}  copyTop=${Math.round(top)}`);
console.log(`subject spans x ${Math.round(f.dx + 812 * f.s)}..${Math.round(f.dx + 1940 * f.s)} of ${CW}\n`);
for (const [name, y0, y1, xL, xR, fg] of rows) {
  const w = worst(fg, y0, y1, xL, xR);
  const verdict = w.r >= 7 ? "AAA" : w.r >= 4.5 ? "AA" : w.r >= 3 ? "AA-large" : "FAIL";
  console.log(
    `${name}  worst ${w.r.toFixed(2)}:1  ${verdict.padEnd(9)}` +
    ` at x=${w.x} (${Math.round((w.x / CW) * 100)}% across)  alpha=${w.a.toFixed(2)}`
  );
}
