/**
 * Offline composite of the hero at several viewport widths. NOT part of the build.
 *
 *   node scripts/preview-hero.mjs
 *
 * This is a LAYOUT PROOF, not a screenshot. It composites the real base plate
 * at the real fit rect, applies the real scrim, and lays the copy out at the
 * real clamp sizes with line breaks measured from the real advance widths. What
 * it cannot do is use Bricolage Grotesque and Karla — librsvg does not have
 * them here, so the text renders in a generic sans. Positions, sizes, wrap
 * points and block rhythm are accurate; letterforms are not.
 *
 * It exists because the browser available in this repo cannot verify the hero:
 * rAF is suspended, getBoundingClientRect returns 0, screenshots time out, and
 * the page's streaming suspense boundary never completes, so <main> is empty
 * and every DOM query lands in a hidden holding div instead.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

/* ── fit math, mirroring components/hero/liquid-glass.ts ───────────────── */

const PLATE_W = 2688, PLATE_H = 1520;
const SUBJECT_W = 1128, SUBJECT_CX = 0.512, FACE_CY = 0.403;
const SUBJECT_TARGET = 0.9, FOCAL_Y = 0.42;

function computeFit(cw, ch) {
  const cover = Math.max(cw / PLATE_W, ch / PLATE_H);
  const capped = (SUBJECT_TARGET * cw) / SUBJECT_W;
  const scale = Math.min(cover, capped);
  const dw = PLATE_W * scale, dh = PLATE_H * scale;
  const wide = cw >= 1024;
  const anchorX = wide ? 0.66 : 0.5;
  const anchorY = wide ? 0.5 : FOCAL_Y;
  return {
    scale, dw, dh,
    dx: cw * anchorX - SUBJECT_CX * dw,
    dy: ch * anchorY - FACE_CY * dh,
  };
}

/* ── type scale, mirroring the h1 classes ─────────────────────────────── */

const clamp = (lo, v, hi) => Math.min(hi, Math.max(lo, v));
const headlineSize = (w, h) =>
  w >= 1024 ? clamp(48, Math.min(w * 0.054, h * 0.10), 72)
  : w >= 640 ? clamp(40, w * 0.052, 52)
  : clamp(28, w * 0.075, 40);

// Approximate advance widths for the display face. Measured against Bricolage
// Grotesque Bold in the browser: mean advance ~0.512em over this headline.
const ADV_DISPLAY = 0.512;
const ADV_BODY = 0.505;

function wrap(text, size, width, adv) {
  const out = [];
  let cur = "";
  for (const word of text.split(" ")) {
    const t = cur ? cur + " " + word : word;
    if (t.length * size * adv > width && cur) { out.push(cur); cur = word; }
    else cur = t;
  }
  out.push(cur);
  return out;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;");

const HEADLINE = "Skill was never your problem. Your proof is.";
const SHORT = "You can do the work. Proof, visibility and a path to the buyer are what's missing.";
const LONG = "You can do the work. What is missing is proof a stranger can check, visibility with the people who buy, and a path that ends at a decision. I built that system for myself, I run it for clients, and I am teaching it.";
const HELPER = "The Zero-to-Opportunity System opens soon. You hear first.";

async function render(cw, ch, label) {
  const fit = computeFit(cw, ch);
  const wide = cw >= 1024;
  const padX = cw >= 768 ? 40 : 24;
  // w-full / sm:max-w-[34rem] / lg:max-w-[36rem]
  const colW = wide ? 576 : cw >= 640 ? Math.min(544, cw - padX * 2) : cw - padX * 2;

  const hSize = headlineSize(cw, ch);
  const hLead = hSize * (cw >= 640 ? 0.96 : 0.98);
  const bodySize = wide ? 18 : 16;
  const bodyLead = bodySize * 1.625;

  const hLines = wrap(HEADLINE, hSize, colW, ADV_DISPLAY);
  const bodyLines = wrap(wide ? LONG : SHORT, bodySize, Math.min(colW, 46 * bodySize * ADV_BODY), ADV_BODY);

  // Block heights, matching the component's spacing utilities.
  const gapSup = wide ? 20 : 16;          // lg:mt-5 / mt-4
  const gapForm = cw >= 768 ? 48 : 40;    // md:mt-12 / mt-10
  const formH = 48, gapHelp = 8, helpH = 16, gapLinks = 24, linksH = 20;

  const blockH = hLines.length * hLead + gapSup + bodyLines.length * bodyLead
    + gapForm + formH + gapHelp + helpH + gapLinks + linksH;

  // justify-end on narrow (pb-14), justify-center on lg (pt-20, pb-0)
  const top = wide
    ? 80 + Math.max(0, (ch - 80 - blockH) / 2)
    : Math.max(112, ch - 56 - blockH);

  // The fitted plate is wider than the viewport at every size here (that is the
  // point of the width cap), so crop to the visible intersection: sharp will not
  // composite an input larger than the canvas, negative offsets included.
  const dwR = Math.round(fit.dw), dhR = Math.round(fit.dh);
  const dxR = Math.round(fit.dx), dyR = Math.round(fit.dy);
  const srcX = Math.max(0, -dxR), srcY = Math.max(0, -dyR);
  const left = Math.max(0, dxR), top_ = Math.max(0, dyR);
  const cropW = Math.min(dwR - srcX, cw - left);
  const cropH = Math.min(dhR - srcY, ch - top_);

  const plate = await sharp("public/hero/king-base-1600.png")
    .resize(dwR, dhR, { fit: "fill" })
    .extract({ left: srcX, top: srcY, width: cropW, height: cropH })
    .toBuffer();

  // Scrim: bottom band on narrow, left band on lg. Same stops as the component.
  const scrim = wide
    ? `<linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0" stop-color="#000" stop-opacity="1"/>
         <stop offset="0.34" stop-color="#000" stop-opacity="0.88"/>
         <stop offset="0.66" stop-color="#000" stop-opacity="0.45"/>
         <stop offset="1" stop-color="#000" stop-opacity="0"/>
       </linearGradient>
       <rect x="0" y="0" width="${cw * 0.72}" height="${ch}" fill="url(#s)"/>`
    : `<linearGradient id="s" x1="0" y1="1" x2="0" y2="0">
         <stop offset="0" stop-color="#000" stop-opacity="1"/>
         <stop offset="0.34" stop-color="#000" stop-opacity="1"/>
         <stop offset="0.62" stop-color="#000" stop-opacity="0.72"/>
         <stop offset="1" stop-color="#000" stop-opacity="0"/>
       </linearGradient>
       <rect x="0" y="${ch * 0.58}" width="${cw}" height="${ch * 0.42}" fill="url(#s)"/>`;

  let y = top;
  let text = "";
  for (const l of hLines) {
    y += hLead;
    text += `<text x="${padX}" y="${y - hLead * 0.18}" font-size="${hSize}" font-weight="700" fill="#F2EDE7" font-family="sans-serif" letter-spacing="${-0.025 * hSize}">${esc(l)}</text>`;
  }
  y += gapSup;
  for (const l of bodyLines) {
    y += bodyLead;
    text += `<text x="${padX}" y="${y - bodyLead * 0.28}" font-size="${bodySize}" fill="#A8A29C" font-family="sans-serif">${esc(l)}</text>`;
  }
  y += gapForm;
  const inputW = Math.min(colW, 340);
  text += `<rect x="${padX}" y="${y}" width="${inputW * 0.56}" height="${formH}" rx="6" fill="none" stroke="#3A3A38"/>`;
  text += `<text x="${padX + 14}" y="${y + 30}" font-size="14" fill="#6B6862" font-family="sans-serif">your email</text>`;
  text += `<rect x="${padX + inputW * 0.56 + 10}" y="${y}" width="${inputW * 0.46}" height="${formH}" rx="6" fill="#E8A33D"/>`;
  text += `<text x="${padX + inputW * 0.56 + 26}" y="${y + 30}" font-size="14" font-weight="600" fill="#111" font-family="sans-serif">Join the waitlist</text>`;
  y += formH + gapHelp;
  text += `<text x="${padX}" y="${y + 12}" font-size="12" fill="#6B6862" font-family="sans-serif">${esc(HELPER)}</text>`;
  y += helpH + gapLinks;
  text += `<text x="${padX}" y="${y + 14}" font-size="14" fill="#A8A29C" font-family="sans-serif">See the work  &#183;  hire me to build it</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><defs></defs>${scrim}${text}</svg>`;

  const out = `scripts/out/hero-${label}.png`;
  await sharp({ create: { width: cw, height: ch, channels: 3, background: "#000000" } })
    .composite([
      { input: plate, left, top: top_ },
      { input: Buffer.from(svg), left: 0, top: 0 },
    ])
    .png()
    .toFile(out);

  console.log(
    `${out}  ${cw}x${ch}  scale=${fit.scale.toFixed(4)}  ` +
      `headline=${hSize.toFixed(1)}px x${hLines.length} lines  ` +
      `body=${bodyLines.length} lines  blockH=${Math.round(blockH)}  top=${Math.round(top)}`
  );
  return out;
}

mkdirSync("scripts/out", { recursive: true });
const files = [];
files.push(await render(620, 800, "620"));
files.push(await render(900, 800, "900"));
files.push(await render(1280, 720, "1280"));

// Contact sheet so all three can be looked at together.
const imgs = await Promise.all(files.map((f) => sharp(f).resize({ height: 620 }).toBuffer()));
const metas = await Promise.all(imgs.map((b) => sharp(b).metadata()));
const totalW = metas.reduce((s, m) => s + m.width + 12, 0);
let x = 0;
const comps = [];
for (let i = 0; i < imgs.length; i++) {
  comps.push({ input: imgs[i], left: x, top: 0 });
  x += metas[i].width + 12;
}
await sharp({ create: { width: totalW, height: 620, channels: 3, background: "#2a2a2a" } })
  .composite(comps)
  .png()
  .toFile("scripts/out/hero-all.png");
console.log("scripts/out/hero-all.png  contact sheet 620 | 900 | 1280");
