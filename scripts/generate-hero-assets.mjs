/**
 * One-off hero asset generation. NOT part of the build.
 *
 *   node scripts/generate-hero-assets.mjs
 *
 * Reads the two source plates and emits avif + webp + png at three widths into
 * public/hero/. Uses sharp, which is already present via Next's image pipeline,
 * so this adds no dependency and no build step.
 *
 * The two plates MUST stay pixel-aligned: the reveal composites one directly
 * over the other, so any difference in dimensions or crop shows as a seam.
 */
import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const SOURCES = [
  { src: "C:/Users/Bigquiv/Downloads/The King.png", name: "king-base" },
  { src: "C:/Users/Bigquiv/Downloads/The King 2.png", name: "king-chrome" },
];

const WIDTHS = [2560, 1600, 1024];
const OUT = "public/hero";

// Photographic content on a near-pure-black ground, which compresses almost
// for free — at quality 52 the whole mobile pair came to 16 KB against a
// 500 KB budget. The constraint here is not weight, it is the face: skin
// gradients and the helmet light seams are the first things to posterise.
// Quality is set high deliberately and the payload is still ~30x under budget.
const AVIF = { quality: 68, effort: 6, chromaSubsampling: "4:4:4" };
const WEBP = { quality: 88, effort: 6 };

async function main() {
  await mkdir(OUT, { recursive: true });

  const dims = [];
  for (const { src } of SOURCES) {
    const m = await sharp(src).metadata();
    dims.push(`${m.width}x${m.height}`);
  }
  if (dims[0] !== dims[1]) {
    console.error(`ABORT: plates differ — base ${dims[0]}, chrome ${dims[1]}`);
    process.exit(1);
  }
  console.log(`source plates aligned at ${dims[0]}\n`);

  for (const { src, name } of SOURCES) {
    for (const w of WIDTHS) {
      const base = sharp(src).resize({ width: w, withoutEnlargement: true });
      await base.clone().avif(AVIF).toFile(join(OUT, `${name}-${w}.avif`));
      await base.clone().webp(WEBP).toFile(join(OUT, `${name}-${w}.webp`));
    }
    // Single png fallback at the middle width. A 2560 png would be megabytes
    // and no browser that lacks webp is getting a 2560 hero anyway.
    await sharp(src)
      .resize({ width: 1600, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: false })
      .toFile(join(OUT, `${name}-1600.png`));
  }

  const files = (await readdir(OUT)).sort();
  let total = 0;
  console.log("generated:");
  for (const f of files) {
    const s = await stat(join(OUT, f));
    total += s.size;
    console.log(`   ${f.padEnd(26)} ${(s.size / 1024).toFixed(0).padStart(6)} KB`);
  }
  console.log(`\n   total on disk ${(total / 1024 / 1024).toFixed(2)} MB`);

  // What a phone actually downloads: the 1024 avif pair.
  let mobile = 0;
  for (const n of ["king-base-1024.avif", "king-chrome-1024.avif"]) {
    mobile += (await stat(join(OUT, n))).size;
  }
  console.log(`   MOBILE PAYLOAD (2x 1024 avif) ${(mobile / 1024).toFixed(0)} KB` +
    `  ${mobile < 500 * 1024 ? "under" : "OVER"} the 500 KB budget`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
