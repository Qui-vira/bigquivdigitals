/**
 * WCAG contrast check for the mobile hero copy. NOT part of the build.
 *
 *   node scripts/hero-contrast.mjs
 *
 * Samples the real plate at the real narrow fit, composites the scrim stack
 * over it, and reports the worst-case (brightest background) contrast ratio
 * behind each text block. Worst case is the right measure here: the copy sits
 * over a face, so the mean is optimistic and the bright cheek is what actually
 * fails.
 */
import sharp from "sharp";

const PLATE_W = 2688, PLATE_H = 1520;
const SUBJECT_W = 1128, SUBJECT_CX = 0.512, FACE_CY = 0.403;
const TARGET = 0.9, FOCAL = 0.42, CROWN = 0.1, SHOULDER = 0.9;
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
const alphaOver = (a) => (px) => px.map((c) => c * (1 - a));

/** Existing bottom scrim, lg:hidden. "to top" over the bottom 42%. */
function scrimAlpha(y) {
  const start = 0.58;
  if (y < start) return 0;
  const u = 1 - (y - start) / 0.42; // 0 at page bottom, 1 at scrim top
  if (u <= 0.34) return 1;
  if (u <= 0.62) return 1 + (0.72 - 1) * ((u - 0.34) / 0.28);
  return 0.72 * (1 - (u - 0.62) / 0.38);
}

/** Proposed md:hidden overlay, "to bottom", full bleed. */
const STOPS = [[0, 0], [0.24, 0], [0.36, 0.42], [0.46, 0.72], [0.58, 0.78], [1, 0.78]];
function overlayAlpha(y) {
  for (let i = 1; i < STOPS.length; i++) {
    if (y <= STOPS[i][0]) {
      const [y0, a0] = STOPS[i - 1], [y1, a1] = STOPS[i];
      return a0 + (a1 - a0) * ((y - y0) / (y1 - y0));
    }
  }
  return 0.75;
}

const CW = Number(process.argv[2] ?? 592);
const CH = Number(process.argv[3] ?? 800);
const f = narrowFit(CW, CH);
const { data, info } = await sharp("public/hero/king-base-1600.png")
  .resize(Math.round(f.dw), Math.round(f.dh), { fit: "fill" })
  .raw()
  .toBuffer({ resolveWithObject: true });

function brightest(yTop, yBot) {
  let best = null, bestL = -1;
  for (let y = Math.round(yTop); y < Math.round(yBot); y += 2) {
    const py = Math.round(y - f.dy);
    if (py < 0 || py >= info.height) continue;
    for (let x = 24; x < CW - 24; x += 3) {
      const px = Math.round(x - f.dx);
      if (px < 0 || px >= info.width) continue;
      const o = (py * info.width + px) * info.channels;
      const p = [data[o], data[o + 1], data[o + 2]];
      const L = lum(p);
      if (L > bestL) { bestL = L; best = { p, y }; }
    }
  }
  return best;
}

// Block geometry from the component at this viewport.
const hSize = Math.min(40, Math.max(28, CW * 0.075));
const top = Math.max(112, CH - 56 - 403);
const rows = [
  ["headline  #F2EDE7", top, top + 3 * hSize * 0.98, hex("#F2EDE7")],
  ["body  current #A39C93", top + 3 * hSize * 0.98 + 16, top + 3 * hSize * 0.98 + 16 + 4 * 26, hex("#A39C93")],
  ["body  proposed 85% primary", top + 3 * hSize * 0.98 + 16, top + 3 * hSize * 0.98 + 16 + 4 * 26, [206, 202, 196]],
  ["proof current #6B655D", top + 3 * hSize * 0.98 + 16 + 4 * 26 + 12, top + 3 * hSize * 0.98 + 16 + 4 * 26 + 12 + 2 * 23, hex("#6B655D")],
  ["proof proposed 70% primary", top + 3 * hSize * 0.98 + 16 + 4 * 26 + 12, top + 3 * hSize * 0.98 + 16 + 4 * 26 + 12 + 2 * 23, [169, 166, 161]],
];

console.log(`${CW}x${CH}  narrow fit scale=${f.s.toFixed(4)}  copyTop=${Math.round(top)}`);
console.log("worst-case = brightest background pixel behind the block\n");
for (const [name, y0, y1, fg] of rows) {
  const w = brightest(y0, y1);
  if (!w) { console.log(name.padEnd(30), "off-plate (pure black bg)"); continue; }
  const yF = w.y / CH;
  const before = ratio(fg, alphaOver(scrimAlpha(yF))(w.p));
  const a = 1 - (1 - overlayAlpha(yF)) * (1 - scrimAlpha(yF));
  const after = ratio(fg, alphaOver(a)(w.p));
  const verdict = after >= 7 ? "AAA" : after >= 4.5 ? "AA" : after >= 3 ? "AA-large" : "FAIL";
  console.log(
    name.padEnd(30) +
    ` y=${String(Math.round(w.y)).padStart(3)}  alpha ${scrimAlpha(yF).toFixed(2)}->${a.toFixed(2)}` +
    `  ${before.toFixed(2)}:1 -> ${after.toFixed(2)}:1  ${verdict}`
  );
}
