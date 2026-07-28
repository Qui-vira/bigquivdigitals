/**
 * Offline composite of the hero at several viewport widths. NOT part of the build.
 *
 *   node scripts/preview-hero.mjs
 *
 * This is a LAYOUT PROOF, not a screenshot. It composites the real base plate
 * at the real fit rect, applies the real scrim, and lays the copy out at the
 * real clamp sizes with line breaks measured from real advance widths. What it
 * cannot do is use Bricolage Grotesque and Karla, because librsvg does not have
 * them here, so text renders in a generic sans. Positions, sizes, wrap points
 * and block rhythm are accurate; letterforms are not.
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
const SUBJECT_TARGET = 0.9, FOCAL_Y = 0.42, SUBJECT_DESKTOP = 0.42;
const CROWN = 0.1, SHOULDER = 0.9;
const BAND = SHOULDER - CROWN, BAND_CY = (CROWN + SHOULDER) / 2;

function computeFit(cw, ch) {
  const cover = Math.max(cw / PLATE_W, ch / PLATE_H);
  const widthCap = (SUBJECT_TARGET * cw) / SUBJECT_W;
  const heightCap = ch / (BAND * PLATE_H);
  const wide = cw >= 1024;
  const deskTarget = (SUBJECT_DESKTOP * cw) / SUBJECT_W;
  const scale = wide
    ? Math.min(deskTarget, heightCap)
    : Math.min(cover, widthCap, heightCap);
  const dw = PLATE_W * scale, dh = PLATE_H * scale;
  const branch = wide
    ? (scale === heightCap ? "height-cap" : "subject-42%")
    : (scale === heightCap ? "height-cap" : scale === cover ? "cover" : "width-cap");
  return {
    scale, dw, dh, branch,
    dx: cw * (wide ? 0.66 : 0.5) - SUBJECT_CX * dw,
    dy: wide ? ch * 0.5 - BAND_CY * dh : ch * FOCAL_Y - FACE_CY * dh,
  };
}

/* ── type scale, mirroring the h1 classes ─────────────────────────────── */

const clamp = (lo, v, hi) => Math.min(hi, Math.max(lo, v));
const headlineSize = (w, h) =>
  w >= 1024 ? clamp(48, Math.min(w * 0.054, h * 0.072), 64)
  : w >= 640 ? clamp(40, w * 0.052, 52)
  : clamp(28, w * 0.075, 40);

// Mean advance widths, measured against the real loaded faces via canvas
// measureText in the browser, not guessed. The earlier 0.512/0.505 pair was a
// guess and it over-estimated the display face by ~5%, which made this mock
// report a four-line headline and a clipped form at 1337x594 when the real
// page sets three lines and fits.
const ADV_DISPLAY = 0.4854;
const ADV_BODY = 0.4486;
const ADV_PROOF = 0.4556;

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

const HEADLINE = "Your next skill is going to end exactly like the last one did.";
const SUPPORTING = "Mine stopped ending that way in 2022, when I got my first seven-figure naira dev job. Now I have built the thing that fixes yours.";
const PROOF = "Same skills. One move.";
const HELPER = "Zero-to-Opportunity opens soon. The list goes first.";

const NAV_H = 64, NAV_GAP = 24;

async function render(cw, ch, label) {
  const fit = computeFit(cw, ch);
  const wide = cw >= 1024;
  const padX = cw >= 768 ? 40 : 24;
  const colW = wide ? 576 : cw >= 640 ? Math.min(544, cw - padX * 2) : cw - padX * 2;

  const hSize = headlineSize(cw, ch);
  const hLead = hSize * (cw >= 640 ? 0.96 : 0.98);
  const bodySize = wide ? 18 : 16;
  const bodyLead = bodySize * 1.625;
  const proofSize = 14, proofLead = proofSize * 1.625;

  const hLines = wrap(HEADLINE, hSize, colW, ADV_DISPLAY);
  const bodyLines = wrap(SUPPORTING, bodySize, Math.min(colW, 46 * bodySize * ADV_BODY), ADV_BODY);
  const proofLines = wrap(PROOF, proofSize, Math.min(colW, 46 * proofSize * ADV_PROOF), ADV_PROOF);

  const gapSup = 16, gapProof = 12, gapForm = cw >= 768 ? 48 : 40;
  const helpH = 21, gapHelp = 12, formH = 48, ctaH = 16 + 20; // + 'Hire me'

  const blockH =
    hLines.length * hLead + gapSup + bodyLines.length * bodyLead +
    gapProof + proofLines.length * proofLead +
    gapForm + helpH + gapHelp + formH + ctaH;

  // lg: safe-centre inside [navH+gap, ch-24]. Narrow: bottom-anchored.
  const padTop = wide ? NAV_H + NAV_GAP : 112;
  const padBot = wide ? 24 : 56;
  const top = wide
    ? Math.max(padTop, padTop + (ch - padTop - padBot - blockH) / 2)
    : Math.max(padTop, ch - padBot - blockH);

  const plate = await sharp("public/hero/king-base-1600.png")
    .resize(Math.max(1, Math.round(fit.dw)), Math.max(1, Math.round(fit.dh)), { fit: "fill" })
    .toBuffer();

  // Crop the plate to the visible intersection; sharp will not composite an
  // input larger than the canvas even at a negative offset.
  const srcX = Math.max(0, Math.round(-fit.dx));
  const srcY = Math.max(0, Math.round(-fit.dy));
  const left = Math.max(0, Math.round(fit.dx));
  const top_ = Math.max(0, Math.round(fit.dy));
  const cropW = Math.min(Math.round(fit.dw) - srcX, cw - left);
  const cropH = Math.min(Math.round(fit.dh) - srcY, ch - top_);
  const visible = await sharp(plate)
    .extract({ left: srcX, top: srcY, width: Math.max(1, cropW), height: Math.max(1, cropH) })
    .toBuffer();

  const scrim = wide
    ? `<linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0" stop-color="#000" stop-opacity="1"/>
         <stop offset="0.34" stop-color="#000" stop-opacity="0.88"/>
         <stop offset="0.66" stop-color="#000" stop-opacity="0.45"/>
         <stop offset="1" stop-color="#000" stop-opacity="0"/>
       </linearGradient>
       <rect x="0" y="0" width="${cw * 0.72}" height="${ch}" fill="url(#s)"/>`
    : `<linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#000" stop-opacity="0"/>
         <stop offset="0.24" stop-color="#000" stop-opacity="0"/>
         <stop offset="0.36" stop-color="#000" stop-opacity="0.42"/>
         <stop offset="0.46" stop-color="#000" stop-opacity="0.72"/>
         <stop offset="0.58" stop-color="#000" stop-opacity="0.78"/>
         <stop offset="1" stop-color="#000" stop-opacity="0.78"/>
       </linearGradient>
       <rect x="0" y="0" width="${cw}" height="${ch}" fill="url(#m)"/>
       <linearGradient id="s" x1="0" y1="1" x2="0" y2="0">
         <stop offset="0" stop-color="#000" stop-opacity="1"/>
         <stop offset="0.34" stop-color="#000" stop-opacity="1"/>
         <stop offset="0.62" stop-color="#000" stop-opacity="0.72"/>
         <stop offset="1" stop-color="#000" stop-opacity="0"/>
       </linearGradient>
       <rect x="0" y="${ch * 0.58}" width="${cw}" height="${ch * 0.42}" fill="url(#s)"/>`;

  // Nav band, so headline/nav collision is visible if it ever returns.
  let text =
    `<rect x="0" y="0" width="${cw}" height="${NAV_H}" fill="#000" fill-opacity="0.55"/>` +
    `<line x1="0" y1="${NAV_H}" x2="${cw}" y2="${NAV_H}" stroke="#E8A33D" stroke-opacity="0.35"/>` +
    `<text x="${padX}" y="40" font-size="17" font-weight="700" fill="#F2EDE7" font-family="sans-serif">BigQuiv Digitals</text>`;

  let y = top;
  for (const l of hLines) {
    y += hLead;
    text += `<text x="${padX}" y="${y - hLead * 0.18}" font-size="${hSize}" font-weight="700" fill="#F2EDE7" font-family="sans-serif" letter-spacing="${-0.025 * hSize}">${esc(l)}</text>`;
  }
  y += gapSup;
  for (const l of bodyLines) {
    y += bodyLead;
    text += `<text x="${padX}" y="${y - bodyLead * 0.28}" font-size="${bodySize}" fill="${wide ? '#A39C93' : '#CEC9C3'}" font-family="sans-serif">${esc(l)}</text>`;
  }
  y += gapProof;
  for (const l of proofLines) {
    y += proofLead;
    text += `<text x="${padX}" y="${y - proofLead * 0.28}" font-size="${proofSize}" fill="${wide ? '#6B655D' : '#A9A6A1'}" font-family="sans-serif">${esc(l)}</text>`;
  }
  y += gapForm;
  text += `<text x="${padX}" y="${y + 14}" font-size="14" fill="#A8A29C" font-family="sans-serif">${esc(HELPER)}</text>`;
  y += helpH + gapHelp;
  const inputW = Math.min(colW, 360);
  text += `<rect x="${padX}" y="${y}" width="${inputW * 0.56}" height="${formH}" rx="6" fill="none" stroke="#3A3A38"/>`;
  text += `<text x="${padX + 14}" y="${y + 30}" font-size="14" fill="#6B6862" font-family="sans-serif">your email</text>`;
  text += `<rect x="${padX + inputW * 0.56 + 10}" y="${y}" width="${inputW * 0.46}" height="${formH}" rx="6" fill="#E8A33D"/>`;
  text += `<text x="${padX + inputW * 0.56 + 26}" y="${y + 30}" font-size="14" font-weight="600" fill="#111" font-family="sans-serif">Join the waitlist</text>`;
  text += `<text x="${padX}" y="${y + formH + 30}" font-size="14" fill="#A8A29C" font-family="sans-serif">Hire me</text>`;
  const formBottom = y + formH + ctaH;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">${scrim}${text}</svg>`;
  const out = `scripts/out/hero-${label}.png`;
  await sharp({ create: { width: cw, height: ch, channels: 3, background: "#000000" } })
    .composite([
      { input: visible, left, top: top_ },
      { input: Buffer.from(svg), left: 0, top: 0 },
    ])
    .png()
    .toFile(out);

  const crownY = fit.dy + CROWN * fit.dh, shY = fit.dy + SHOULDER * fit.dh;
  console.log(
    `${out}  ${cw}x${ch}  scale=${fit.scale.toFixed(4)} (${fit.branch})\n` +
      `   headline ${hSize.toFixed(1)}px x${hLines.length}   copyTop=${Math.round(top)} (nav ends ${NAV_H})` +
      `   formBottom=${Math.round(formBottom)}/${ch} ${formBottom <= ch ? "OK" : "CLIPPED"}\n` +
      `   crown y=${crownY.toFixed(0)} ${crownY >= 0 ? "ok" : "CUT"}   shoulders y=${shY.toFixed(0)} ${shY <= ch ? "ok" : "CUT"}`
  );
  return out;
}

mkdirSync("scripts/out", { recursive: true });
const files = [];
files.push(await render(592, 800, "592x800"));
files.push(await render(1280, 720, "1280x720"));
files.push(await render(1337, 594, "1337x594"));
files.push(await render(1440, 900, "1440x900"));
files.push(await render(1920, 1080, "1920x1080"));

const imgs = await Promise.all(files.map((f) => sharp(f).resize({ height: 560 }).toBuffer()));
const metas = await Promise.all(imgs.map((b) => sharp(b).metadata()));
const totalW = metas.reduce((s, m) => s + m.width + 12, 0);
let x = 0;
const comps = [];
for (let i = 0; i < imgs.length; i++) {
  comps.push({ input: imgs[i], left: x, top: 0 });
  x += metas[i].width + 12;
}
await sharp({ create: { width: totalW, height: 560, channels: 3, background: "#2a2a2a" } })
  .composite(comps)
  .png()
  .toFile("scripts/out/hero-all.png");
console.log("scripts/out/hero-all.png  contact sheet");
