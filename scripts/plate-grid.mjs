/**
 * Overlay a labelled normalised grid on the base plate. NOT part of the build.
 *
 *   node scripts/plate-grid.mjs
 *
 * The drift path is specified in normalised plate coordinates, so the landmarks
 * it is meant to trace (eyes, mouth, jaw, shoulders) have to be read off the
 * plate rather than assumed from facial-proportion rules of thumb. This renders
 * the grid so those values can be measured by eye and written down.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const PLATE_W = 2688, PLATE_H = 1520;
const OUT_W = 1200;
const k = OUT_W / PLATE_W;
const OUT_H = Math.round(PLATE_H * k);

const lines = [];
for (let i = 1; i < 20; i++) {
  const y = i / 20;
  const strong = i % 5 === 0;
  lines.push(
    `<line x1="0" y1="${y * OUT_H}" x2="${OUT_W}" y2="${y * OUT_H}" stroke="${strong ? "#00FF88" : "#00FF8855"}" stroke-width="${strong ? 1.4 : 0.6}"/>` +
      `<text x="4" y="${y * OUT_H - 3}" font-size="13" fill="#00FF88" font-family="monospace">${y.toFixed(2)}</text>`
  );
}
for (let i = 1; i < 12; i++) {
  const x = i / 12;
  lines.push(
    `<line x1="${x * OUT_W}" y1="0" x2="${x * OUT_W}" y2="${OUT_H}" stroke="#00FF8833" stroke-width="0.6"/>` +
      `<text x="${x * OUT_W + 3}" y="14" font-size="12" fill="#00FF88" font-family="monospace">${x.toFixed(2)}</text>`
  );
}
// Known measured landmarks, for reference against the grid.
lines.push(
  `<line x1="${0.302 * OUT_W}" y1="0" x2="${0.302 * OUT_W}" y2="${OUT_H}" stroke="#FF3366" stroke-width="1.6"/>`,
  `<line x1="${0.722 * OUT_W}" y1="0" x2="${0.722 * OUT_W}" y2="${OUT_H}" stroke="#FF3366" stroke-width="1.6"/>`,
  `<line x1="0" y1="${0.403 * OUT_H}" x2="${OUT_W}" y2="${0.403 * OUT_H}" stroke="#FF3366" stroke-width="1.6"/>`,
  `<text x="${0.302 * OUT_W + 5}" y="${OUT_H - 8}" font-size="14" fill="#FF3366" font-family="monospace">subject 0.302</text>`,
  `<text x="${0.722 * OUT_W + 5}" y="${OUT_H - 8}" font-size="14" fill="#FF3366" font-family="monospace">0.722</text>`,
  `<text x="${OUT_W - 190}" y="${0.403 * OUT_H - 6}" font-size="14" fill="#FF3366" font-family="monospace">face cy 0.403</text>`
);

mkdirSync("scripts/out", { recursive: true });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${OUT_H}">${lines.join("")}</svg>`;
await sharp("public/hero/king-base-1600.png")
  .resize(OUT_W, OUT_H, { fit: "fill" })
  .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
  .png()
  .toFile("scripts/out/plate-grid.png");
console.log(`scripts/out/plate-grid.png  ${OUT_W}x${OUT_H}  (plate ${PLATE_W}x${PLATE_H})`);
