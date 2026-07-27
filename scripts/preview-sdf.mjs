/**
 * Offline render of the hero's blob field. NOT part of the build.
 *
 *   node scripts/preview-sdf.mjs
 *   node scripts/preview-sdf.mjs --k 0.55 --amp 0.42 --octaves 4
 *
 * The automated browser available in this repo never composites — rAF is
 * suspended and screenshots time out — so the shader cannot be looked at while
 * it is being written. This ports the *same* field math (gnoise -> fbm ->
 * noise-modulated radius -> polynomial smin) to the CPU and writes a PNG, which
 * makes the part most likely to be wrong visible: is the silhouette actually
 * lobed, do two blobs merge with a real neck, does the union pinch off cleanly,
 * and does a decaying trail stay continuous.
 *
 * It does NOT validate refraction, chromatic aberration or specular. Those are
 * colour operations on the field's gradient and need a real device.
 *
 * Caveat: GLSL fract(sin(x) * 43758.5) and JS Math.sin do not agree bit for bit,
 * so the exact lobe positions here will differ from the GPU. The statistics of
 * the shape — lobe count, amplitude, merge behaviour — are what this checks.
 *
 * PNG is written with node:zlib directly. sharp is only a transitive dependency
 * of Next's image pipeline and is not worth relying on for a dev script.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

/* ── args ──────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number.parseFloat(args[i + 1]) : dflt;
};

const K_FACTOR = arg("k", 0.45);
const AMP = arg("amp", 0.38);
const OCTAVES = arg("octaves", 4);
const BAND_FACTOR = arg("band", 0.28);
// Defaults mirror the shipped constants in components/hero/glsl.ts.
const NOISE_FREQ = arg("freq", 1.7);
const GAIN = arg("gain", 0.35);
const R0 = 90;

/* ── field math, mirroring components/hero/glsl.ts ─────────────────────── */

const fract = (x) => x - Math.floor(x);
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function hash2(x, y) {
  const px = x * 127.1 + y * 311.7;
  const py = x * 269.5 + y * 183.3;
  return [
    -1 + 2 * fract(Math.sin(px) * 43758.5453123),
    -1 + 2 * fract(Math.sin(py) * 43758.5453123),
  ];
}

function gnoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const dot = (cx, cy) => {
    const [gx, gy] = hash2(ix + cx, iy + cy);
    return gx * (fx - cx) + gy * (fy - cy);
  };
  return mix(
    mix(dot(0, 0), dot(1, 0), ux),
    mix(dot(0, 1), dot(1, 1), ux),
    uy
  );
}

function fbm(x, y) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < OCTAVES; i++) {
    sum += amp * gnoise(x, y);
    norm += amp;
    x *= 2.02;
    y *= 2.02;
    amp *= GAIN;
  }
  return sum / norm;
}

function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return mix(b, a, h) - k * h * (1 - h);
}

function field(px, py, blobs, k) {
  let d = 1e9;
  for (const b of blobs) {
    if (b.r <= 0) continue;
    const qx = px - b.x;
    const qy = py - b.y;
    const l = Math.hypot(qx, qy) + 1e-4;
    const n = fbm((qx / l) * NOISE_FREQ + b.seed, (qy / l) * NOISE_FREQ);
    d = smin(d, l - b.r * (1 + AMP * n), k);
  }
  return d;
}

/* ── panels ────────────────────────────────────────────────────────────── */

const S = 320;
const HALF = S / 2;

const panels = [
  {
    label: "single",
    blobs: [{ x: HALF, y: HALF, r: R0, seed: 1.7 }],
  },
  {
    label: "merge 1.2R",
    blobs: [
      { x: HALF - R0 * 0.6, y: HALF, r: R0, seed: 1.7 },
      { x: HALF + R0 * 0.6, y: HALF, r: R0, seed: 9.2 },
    ],
  },
  {
    label: "pinch 1.9R",
    blobs: [
      { x: HALF - R0 * 0.95, y: HALF, r: R0, seed: 1.7 },
      { x: HALF + R0 * 0.95, y: HALF, r: R0, seed: 9.2 },
    ],
  },
  {
    label: "trail",
    blobs: Array.from({ length: 7 }, (_, i) => ({
      // A curved path with the 0.95^frame heal decay applied down the tail.
      x: 40 + i * 40,
      y: HALF + Math.sin(i * 0.7) * 46,
      r: R0 * 0.72 * Math.pow(0.95, i * 6),
      seed: i * 3.3 + 0.5,
    })),
  },
];

const W = S * panels.length;
const H = S;
const rgb = Buffer.alloc(W * H * 3);

const k = K_FACTOR * R0;
const band = BAND_FACTOR * R0;

for (let p = 0; p < panels.length; p++) {
  const { blobs } = panels[p];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < S; x++) {
      const d = field(x, y, blobs, k);
      const i = (y * W + (p * S + x)) * 3;
      // Neutral on purpose. An earlier version tinted this readout amber, which
      // read as though the glass itself were coloured. It is not: this is a
      // diagnostic of the field, and the shader applies no tint at all.
      if (d <= 0) {
        // inside: bright core, stepping down toward the rim so necks read
        const t = clamp(-d / band, 0, 1);
        const v = Math.round(mix(178, 255, t));
        rgb[i] = rgb[i + 1] = rgb[i + 2] = v;
      } else if (d < band) {
        // the rim band the shader shades: refraction and specular live here
        const v = Math.round(96 * (1 - d / band));
        rgb[i] = rgb[i + 1] = rgb[i + 2] = v;
      }
    }
  }
  // panel separator
  if (p > 0) {
    for (let y = 0; y < H; y++) {
      const i = (y * W + p * S) * 3;
      rgb[i] = rgb[i + 1] = rgb[i + 2] = 40;
    }
  }
}

/* ── minimal PNG writer ────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // truecolour
// 10..12 are compression, filter and interlace, all 0

// One filter byte (0 = None) per scanline.
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  rgb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = "scripts/out/sdf-preview.png";
writeFileSync(out, png);
console.log(
  `${out}  ${W}x${H}\n` +
    `panels: ${panels.map((p) => p.label).join(" | ")}\n` +
    `k=${K_FACTOR} (${k.toFixed(1)}px)  amp=${AMP}  octaves=${OCTAVES}  ` +
    `band=${BAND_FACTOR} (${band.toFixed(1)}px)  R0=${R0}`
);
