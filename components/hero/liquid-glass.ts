/**
 * WebGL1 liquid-glass reveal engine for the hero.
 *
 * Framework-free on purpose: HeroReveal owns the markup, this owns the pixels.
 *
 * Replaces the Canvas2D stamp-and-heal pipeline. The old one accumulated
 * erasure into an offscreen alpha mask and healed by redrawing the top plate at
 * a low alpha each frame. That mask carried coverage but no distance, so the
 * boundary could only ever be cut, never bent. Here the same silhouette is a
 * signed distance field evaluated per pixel, which is what makes refraction,
 * chromatic aberration and specular possible at all.
 *
 * The heal *timing* is preserved exactly rather than re-felt by hand. The old
 * constant was HEAL_ALPHA = 0.05 applied per frame, i.e. 0.95^n remaining after
 * n frames. Solving 0.95^n = 0.10 gives n = 44.9 frames = 0.75s at 60fps, which
 * matches the ~0.75s heal window the old code documented. BLOB_TTL_MS below is
 * 900ms with that same exponential shape, so the tail dies on the old schedule.
 */

import { VERT, buildFrag } from "./glsl";

/* ── fit math, unchanged from the Canvas2D version ─────────────────────── */

const PLATE_W = 2688;
const PLATE_H = 1520;
const SUBJECT_W = 1128;
const SUBJECT_CX = 0.512;
const FACE_CY = 0.403;
const SUBJECT_TARGET = 0.9;
const FOCAL_Y = 0.42;

/**
 * The band that must stay inside the frame, in normalised plate height:
 * crown of the head to the shoulder line, read off scripts/plate-grid.mjs.
 *
 * The fit was min(cover, widthCap) with the FACE pinned to viewport centre.
 * That formula is unchanged since the first canvas version and never regressed,
 * but it only ever constrained width. Vertically it guaranteed nothing: at wide
 * viewports it placed plate 0.403 at viewport centre, which pushes the plate
 * down by about 0.097 of its height, so the shoulder line at 0.90 landed at
 * roughly 0.997 of the viewport and fell off the moment the plate was taller
 * than the viewport. At 1337x594 that cut the shoulders by 79px.
 *
 * This was invisible while the hero rendered black. It became a visible fault
 * the moment the plate started painting.
 */
const SUBJECT_CROWN = 0.1;
const SUBJECT_SHOULDER = 0.9;
const SUBJECT_BAND = SUBJECT_SHOULDER - SUBJECT_CROWN;
const SUBJECT_BAND_CY = (SUBJECT_CROWN + SUBJECT_SHOULDER) / 2;

/**
 * Fraction of viewport width the subject occupies at desktop.
 *
 * Cover made this drift with aspect ratio rather than hold steady. The plate is
 * 1.768:1, so at 1920x1080 (1.778) cover is width-driven and the subject lands
 * at 42%, while at 1440x900 (1.6) cover is height-driven, the plate overflows
 * sideways, and the subject swells to 46.4%. Same code, two different crops:
 * one framed, one tight on the head.
 *
 * Pinning the subject to a constant fraction costs a vertical letterbox at
 * shorter aspect ratios, and that is free here for the same reason it is free
 * on a phone: the studio backdrop is #000000 on all four corners, the page
 * ground is the same value, and the shader paints black outside the plate rect.
 * The band is invisible.
 */
const SUBJECT_DESKTOP = 0.42;

const HEAD_W = 850;
const BRUSH_HEAD_FRAC = 0.225;
/**
 * Degenerate-scale guards only, in CSS px.
 *
 * These were 40 and 190, tight enough to be a second, viewport-relative
 * definition of the radius fighting the plate-relative one. They never actually
 * bite between 390px and 1440px (the raw value runs 59.5 to 113.2), but at 40
 * the floor would have engaged below a 262px viewport and quietly broken the
 * "same fraction of the face at every width" property. Widened so the plate
 * relation is the only thing setting the size in any real case.
 */
const BRUSH_MIN = 14;
const BRUSH_MAX = 400;

/* ── trail timing, carried over ────────────────────────────────────────── */

const IDLE_MS = 1200;

/* ── drift path, in normalised PLATE coordinates ───────────────────────── */

/**
 * Landmarks read off the plate via scripts/plate-grid.mjs, normalised to plate
 * height: crown 0.10, brow 0.30, eyes 0.42, nose 0.55, mouth 0.63, jaw/beard
 * 0.77, shoulders 0.90.
 *
 * The old path was centred on the face at 0.403 with amplitude 0.16, so it
 * ranged 0.24..0.56: forehead, eyes and nose, and nothing below. It never
 * reached the mouth. The range is now the whole subject, crown to shoulder
 * line, so the reveal travels the full head rather than hovering over the eyes.
 *
 * Everything here is time-based and plate-relative, so traversal takes the same
 * number of SECONDS at any viewport and covers the same part of the subject.
 */
const DRIFT_CX = 0.512; // subject centre
const DRIFT_AX = 0.2014; // 0.48 x subject width -> spans 0.311..0.713
const DRIFT_CY = 0.5;
const DRIFT_AY = 0.4; // spans 0.10..0.90, crown to shoulders
/**
 * Slowed from 1.7 rad/s. That crossed the sweep in 1.848s, which reads as a
 * rush on a phone: there is no pointer on touch, so drift is the ONLY motion
 * and it plays against a face filling 90% of the viewport rather than 42%.
 * Same seconds at every width either way; this is a pacing choice, not a fix.
 */
const DRIFT_WX = 0.95;
/** Two incommensurate vertical terms, so the path fills the band rather than
 *  retracing one line. */
const DRIFT_WY1 = 0.62;
const DRIFT_WY2 = 1.43;
const DRIFT_MIX = 0.68;
const DRIFT_PHASE = 1.7;

/** Per-frame survival factor from the old HEAL_ALPHA = 0.05. */
const HEAL_PER_FRAME = 0.95;
const BLOB_TTL_MS = 900;
/** Below this the blob contributes nothing worth a uniform slot. */
const CULL_FACTOR = 0.06;

/* ── trail geometry ────────────────────────────────────────────────────── */

/** Emit a new blob once the pointer has travelled this fraction of a radius. */
const SPACING_FRAC = 0.55;
/**
 * Velocity-adaptive radius. Fixed spacing alone beads on a fast flick at tier 2,
 * where only 12 slots are available and a dropped frame doubles the gap. Two
 * independent guards:
 *
 *   rVel = R0 * clamp(1 + 0.6 * v / 1600, 1.0, 1.8)     smooth, velocity-driven
 *   rGeo = actualSpacing * 0.62                          geometric guarantee
 *   r    = clamp(max(rVel, rGeo), R0, R0 * 2.2)
 *
 * rVel is the curve; rGeo is the backstop that holds even if the velocity
 * estimate is stale after a long frame. 0.62 is just over half the spacing, so
 * consecutive circles always overlap before smin() is even considered — smin
 * then closes the neck rather than being asked to invent one.
 */
/**
 * PLATE px/s, not CSS px/s. This was 1600 CSS px/s, and it was the one genuine
 * unit-space bug in the trail: pointer velocity is measured in CSS px, so the
 * same gesture across the subject produced 351px of travel on a 390 viewport
 * and 668px on a 1440 one. The radius therefore grew roughly twice as eagerly
 * on desktop for the identical movement. Dividing by the fit scale puts the
 * measurement in the same space as the radius it feeds.
 *
 * 3200 plate px/s preserves the previous desktop behaviour: 1600 CSS px/s at a
 * typical desktop fit scale of ~0.5 is 3200 plate px/s.
 */
const VEL_REF = 3200;
const VEL_GROWTH = 0.6;
const VEL_MAX = 1.8;
const VEL_HARD_MAX = 2.2;
const CONTINUITY = 0.62;
/** Velocity EMA weight; damps a single erratic sample without adding lag. */
const VEL_SMOOTH = 0.25;

/* ── performance tiers ─────────────────────────────────────────────────── */

export interface Tier {
  readonly name: string;
  readonly resScale: number;
  readonly octaves: number;
  readonly maxBlobs: number;
}

export const TIERS: readonly Tier[] = [
  { name: "desktop", resScale: 1.0, octaves: 4, maxBlobs: 24 },
  { name: "mid", resScale: 0.75, octaves: 3, maxBlobs: 16 },
  { name: "mobile", resScale: 0.5, octaves: 2, maxBlobs: 12 },
];

/**
 * Warm-up. The first seconds after load carry texture upload, font swap and
 * hydration, and a desktop that breaches once there would otherwise ratchet
 * down for the whole session. Frame times are ignored entirely until the page
 * has settled, and a step-down then needs a *sustained* breach, not a burst.
 */
const WARMUP_MS = 3000;
const BREACH_MS = 3000;
/** ~42fps. Above this for BREACH_MS and the tier steps down. */
const FRAME_BUDGET_MS = 24;
const SAMPLE_WINDOW = 120;

/* ── tuning ────────────────────────────────────────────────────────────── */

export interface Tuning {
  /** smin smoothing, as a fraction of base radius. Higher = softer merges. */
  k: number;
  /** Silhouette noise amplitude, as a fraction of radius. */
  amp: number;
  /** Refraction displacement at the rim, as a fraction of radius. */
  lens: number;
  /** Channel separation, as a fraction of the displacement. */
  chroma: number;
  /** Rim band width, as a fraction of radius. */
  band: number;
  /** Multiplier on the plate-derived blob radius. 1 = 0.225 of head width. */
  blobScale: number;
  /** Multiplier on drift angular speed. 1 = a 3.31s sweep across the subject. */
  drift: number;
}

export const DEFAULT_TUNING: Tuning = {
  k: 0.45,
  amp: 0.38,
  lens: 0.1,
  chroma: 0.08,
  band: 0.28,
  blobScale: 1,
  drift: 1,
};

/** Dev-only tier overrides, so a tier can be tested without shipping it. */
export interface TierOverrides {
  octaves?: number;
  resScale?: number;
  maxBlobs?: number;
}

export interface Stats {
  meanMs: number;
  p95Ms: number;
  fps: number;
  tierIndex: number;
  tierName: string;
  resScale: number;
  octaves: number;
  maxBlobs: number;
  activeBlobs: number;
  /** Largest MAX_BLOBS this GPU's uniform budget would allow. */
  blobCeiling: number;
  baseRadiusPx: number;
  warmingUp: boolean;
  tune: Tuning;
}

export interface Handle {
  resize(): void;
  setPointer(x: number, y: number): void;
  setVisible(on: boolean): void;
  setTuning(t: Partial<Tuning>): void;
  stats(): Stats;
  destroy(): void;
}

interface Blob {
  x: number;
  y: number;
  r: number;
  seed: number;
  born: number;
}

interface Options {
  canvas: HTMLCanvasElement;
  wrap: HTMLElement;
  base: HTMLImageElement;
  chrome: HTMLImageElement;
  tuning?: Partial<Tuning>;
  overrides?: TierOverrides;
  /** Called if WebGL cannot run at all. The caller shows the static plate. */
  onFailure: () => void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log}`);
  }
  return sh;
}

function makeTexture(gl: WebGLRenderingContext, img: HTMLImageElement) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // The plates are not power-of-two, so mipmaps and REPEAT are both off the
  // table. CLAMP_TO_EDGE also stops the refraction offset wrapping a sample
  // from one edge of the portrait to the other.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return tex;
}

/** Initial tier guess from device signals, before anything is measured. */
function guessTier(): number {
  if (typeof window === "undefined") return 0;
  const cores = navigator.hardwareConcurrency ?? 4;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  if (w < 768 || cores <= 4) return 2;
  if (w < 1280 || dpr > 2 || cores <= 8) return 1;
  return 0;
}

export function createLiquidGlass(opts: Options): Handle {
  const { canvas, wrap, base, chrome, onFailure } = opts;

  const gl = (canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  }) ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

  if (!gl) {
    onFailure();
    return noopHandle();
  }

  const tune: Tuning = { ...DEFAULT_TUNING, ...opts.tuning };
  const ov: TierOverrides = opts.overrides ?? {};

  /** Tier values with any dev override applied. */
  const tierOf = (i: number) => ({
    name: TIERS[i].name,
    resScale: ov.resScale ?? TIERS[i].resScale,
    octaves: ov.octaves ?? TIERS[i].octaves,
    maxBlobs: ov.maxBlobs ?? TIERS[i].maxBlobs,
  });

  /**
   * GLSL ES 1.00 only guarantees 16 fragment uniform vectors. Every real device
   * reports far more, but the tier table asks for up to 24 vec4s of blobs plus
   * four more for the frame parameters, so this is queried rather than assumed.
   */
  const uniformBudget = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number;
  const blobCeiling = Math.max(0, uniformBudget - 8);
  if (blobCeiling < 6) {
    onFailure();
    return noopHandle();
  }

  let tierIndex = guessTier();
  let program: WebGLProgram | null = null;
  let maxBlobs = 0;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let blobData = new Float32Array(0);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  let texBase = makeTexture(gl, base);
  let texChrome = makeTexture(gl, chrome);

  function buildProgram(index: number) {
    const tier = tierOf(index);
    const blobs = Math.min(tier.maxBlobs, blobCeiling);
    const prog = gl!.createProgram();
    if (!prog) throw new Error("createProgram failed");
    const vs = compile(gl!, gl!.VERTEX_SHADER, VERT);
    const fs = compile(gl!, gl!.FRAGMENT_SHADER, buildFrag(tier.octaves, blobs));
    gl!.attachShader(prog, vs);
    gl!.attachShader(prog, fs);
    gl!.linkProgram(prog);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) {
      const log = gl!.getProgramInfoLog(prog);
      gl!.deleteProgram(prog);
      throw new Error(`link failed: ${log}`);
    }
    if (program) gl!.deleteProgram(program);
    program = prog;
    maxBlobs = blobs;
    blobData = new Float32Array(blobs * 4);
    gl!.useProgram(prog);
    uniforms = {
      uRes: gl!.getUniformLocation(prog, "uRes"),
      uPlate: gl!.getUniformLocation(prog, "uPlate"),
      uBase: gl!.getUniformLocation(prog, "uBase"),
      uChrome: gl!.getUniformLocation(prog, "uChrome"),
      uTune: gl!.getUniformLocation(prog, "uTune"),
      uFrame: gl!.getUniformLocation(prog, "uFrame"),
      uBlobs: gl!.getUniformLocation(prog, "uBlobs[0]"),
    };
    const loc = gl!.getAttribLocation(prog, "aPos");
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
    gl!.enableVertexAttribArray(loc);
    gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
    gl!.uniform1i(uniforms.uBase, 0);
    gl!.uniform1i(uniforms.uChrome, 1);
  }

  try {
    buildProgram(tierIndex);
  } catch (err) {
    console.error("[hero] shader init failed", err);
    onFailure();
    return noopHandle();
  }

  /* ── state ───────────────────────────────────────────────────────────── */

  let cw = 0;
  let ch = 0;
  let dpr = 1;
  let fit = { dx: 0, dy: 0, dw: 0, dh: 0, scale: 1 };
  let baseR = 90;

  const trail: Blob[] = [];
  let head: { x: number; y: number } | null = null;
  let lastEmit: { x: number; y: number } | null = null;
  let lastInput = 0;
  let lastMoveAt = 0;
  let velocity = 0;
  let t0 = 0;
  let raf = 0;
  let alive = true;
  let visible = true;
  let contextLost = false;

  const frameTimes: number[] = [];
  let lastFrameAt = 0;
  let firstFrameAt = 0;
  let breachStartAt = 0;

  function computeFit() {
    const cover = Math.max(cw / PLATE_W, ch / PLATE_H);
    // Cap so the subject never exceeds SUBJECT_TARGET of the viewport width.
    const widthCap = (SUBJECT_TARGET * cw) / SUBJECT_W;
    // Cap so crown-to-shoulders always fits the viewport height. This is the
    // constraint the original formula lacked entirely.
    const heightCap = ch / (SUBJECT_BAND * PLATE_H);
    const wide = cw >= 1024;
    // Desktop targets a constant subject width and accepts an invisible
    // letterbox. Narrow still covers, because there the plate is the whole
    // backdrop and the copy sits in the black beneath it.
    const scale = wide
      ? Math.min((SUBJECT_DESKTOP * cw) / SUBJECT_W, heightCap)
      : Math.min(cover, widthCap, heightCap);
    const dw = PLATE_W * scale;
    const dh = PLATE_H * scale;
    const anchorX = wide ? 0.66 : 0.5;
    fit = {
      scale,
      dw,
      dh,
      dx: cw * anchorX - SUBJECT_CX * dw,
      // Wide centres the crown-to-shoulder BAND, not the face. Centring the
      // face is what pushed the shoulders off the bottom edge; centring the
      // band keeps both ends in frame and reads as a deliberate portrait crop.
      // Narrow is unchanged: it letterboxes and the copy sits in the black
      // below, so the face wants to be high, at FOCAL_Y.
      dy: wide
        ? ch * 0.5 - SUBJECT_BAND_CY * dh
        : ch * FOCAL_Y - FACE_CY * dh,
    };
    // Plate space, multiplied by the fit scale: the blob covers 0.225 of the
    // head width at every viewport (verified 390/620/1280/1440, all 0.2250).
    baseR = Math.max(
      BRUSH_MIN,
      Math.min(BRUSH_MAX, HEAD_W * BRUSH_HEAD_FRAC * tune.blobScale * scale)
    );
  }

  function resize() {
    const r = wrap.getBoundingClientRect();
    cw = Math.max(1, Math.round(r.width || window.innerWidth));
    ch = Math.max(1, Math.round(r.height || window.innerHeight));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = tierOf(tierIndex).resScale;
    canvas.width = Math.max(1, Math.round(cw * dpr * scale));
    canvas.height = Math.max(1, Math.round(ch * dpr * scale));
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    gl!.viewport(0, 0, canvas.width, canvas.height);
    computeFit();
  }

  /**
   * Velocity-adaptive radius. See the VEL_* block above for the curve.
   * `velocity` is CSS px/s, so it is divided by the fit scale to reach plate
   * px/s before being compared against VEL_REF. Without that division the same
   * gesture grew the radius about twice as fast on desktop as on a phone.
   */
  function radiusFor(spacing: number) {
    const vPlate = velocity / Math.max(1e-6, fit.scale);
    const rVel = baseR * Math.min(VEL_MAX, 1 + (VEL_GROWTH * vPlate) / VEL_REF);
    const rGeo = spacing * CONTINUITY;
    return Math.min(baseR * VEL_HARD_MAX, Math.max(baseR, rVel, rGeo));
  }

  function pushBlob(x: number, y: number, r: number, now: number) {
    trail.push({ x, y, r, seed: Math.random() * 64, born: now });
    // One slot is reserved for the live head, so the tail gets the rest.
    while (trail.length > maxBlobs - 1) trail.shift();
  }

  /**
   * Emit along the segment rather than once per frame. A blob is laid down every
   * SPACING_FRAC of a radius travelled, which rate-limits naturally: idle drift
   * emits rarely and long-lived, a fast flick emits a dense line.
   */
  function emitTo(x: number, y: number, now: number) {
    if (!lastEmit) {
      lastEmit = { x, y };
      pushBlob(x, y, radiusFor(0), now);
      return;
    }
    const dx = x - lastEmit.x;
    const dy = y - lastEmit.y;
    const dist = Math.hypot(dx, dy);
    const spacing = baseR * SPACING_FRAC;
    if (dist < spacing) return;
    const n = Math.min(Math.floor(dist / spacing), maxBlobs);
    const step = dist / n;
    const r = radiusFor(step);
    for (let i = 1; i <= n; i++) {
      pushBlob(lastEmit.x + (dx * i) / n, lastEmit.y + (dy * i) / n, r, now);
    }
    lastEmit = { x, y };
  }

  function stepDown(reason: string, mean: number) {
    if (tierIndex >= TIERS.length - 1) return;
    const from = TIERS[tierIndex].name;
    tierIndex += 1;
    try {
      buildProgram(tierIndex);
    } catch (err) {
      console.error("[hero] tier rebuild failed", err);
      onFailure();
      return;
    }
    resize();
    // A fresh warm-up: the relink itself costs a frame, and that must not
    // cascade into another step-down.
    firstFrameAt = performance.now();
    breachStartAt = 0;
    frameTimes.length = 0;
    console.info(
      `[hero] tier ${from} -> ${TIERS[tierIndex].name}: ${reason} ` +
        `(mean ${mean.toFixed(1)}ms over ${SAMPLE_WINDOW} frames, ` +
        `budget ${FRAME_BUDGET_MS}ms, sustained ${BREACH_MS}ms)`
    );
  }

  function rollingMean() {
    if (!frameTimes.length) return 0;
    let s = 0;
    for (const v of frameTimes) s += v;
    return s / frameTimes.length;
  }

  function frame(now: number) {
    if (!alive || contextLost) return;
    if (!t0) t0 = now;
    if (!firstFrameAt) firstFrameAt = now;

    if (lastFrameAt) {
      frameTimes.push(now - lastFrameAt);
      if (frameTimes.length > SAMPLE_WINDOW) frameTimes.shift();
    }
    lastFrameAt = now;

    // Idle drift. Both terms are normalised PLATE coordinates mapped through
    // the fit rect, so the path traces the same features and takes the same
    // seconds at every viewport. On touch there is no pointer, so this is the
    // only motion the visitor ever sees.
    if (now - lastInput > IDLE_MS) {
      const t = ((now - t0) / 1000) * tune.drift;
      const nx = DRIFT_CX + DRIFT_AX * Math.cos(t * DRIFT_WX);
      const ny =
        DRIFT_CY +
        DRIFT_AY *
          (DRIFT_MIX * Math.sin(t * DRIFT_WY1) +
            (1 - DRIFT_MIX) * Math.sin(t * DRIFT_WY2 + DRIFT_PHASE));
      head = { x: fit.dx + nx * fit.dw, y: fit.dy + ny * fit.dh };
      emitTo(head.x, head.y, now);
    }

    // Age the tail on the old heal curve: 0.95 per frame at 60fps.
    let write = 0;
    for (let i = 0; i < trail.length; i++) {
      const b = trail[i];
      const age = now - b.born;
      if (age > BLOB_TTL_MS) continue;
      if (Math.pow(HEAL_PER_FRAME, (age / 1000) * 60) < CULL_FACTOR) continue;
      trail[write++] = b;
    }
    trail.length = write;

    blobData.fill(0);
    let slot = 0;
    let largest = 0;

    // Slot 0 is the live head, held at full radius while the pointer is active.
    // The Canvas2D version stamped every frame at `cur`, so a stationary pointer
    // held a permanent hole; this reproduces that.
    if (head) {
      const r = radiusFor(0);
      blobData[0] = head.x;
      blobData[1] = head.y;
      blobData[2] = r;
      blobData[3] = 7.3;
      largest = r;
      slot = 1;
    }
    for (let i = trail.length - 1; i >= 0 && slot < maxBlobs; i--) {
      const b = trail[i];
      const decay = Math.pow(HEAL_PER_FRAME, ((now - b.born) / 1000) * 60);
      const r = b.r * decay;
      blobData[slot * 4] = b.x;
      blobData[slot * 4 + 1] = b.y;
      blobData[slot * 4 + 2] = r;
      blobData[slot * 4 + 3] = b.seed;
      if (r > largest) largest = r;
      slot++;
    }
    activeBlobs = slot;

    const resScale = tierOf(tierIndex).resScale;
    const aa = 1.2 / (dpr * resScale);

    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, texBase);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, texChrome);
    gl!.uniform2f(uniforms.uRes, cw, ch);
    gl!.uniform4f(uniforms.uPlate, fit.dx, fit.dy, fit.dw, fit.dh);
    gl!.uniform4f(
      uniforms.uTune,
      tune.k * baseR,
      tune.amp,
      tune.lens * baseR,
      tune.chroma
    );
    gl!.uniform4f(
      uniforms.uFrame,
      tune.band * baseR,
      largest,
      aa,
      (now - t0) / 1000
    );
    gl!.uniform4fv(uniforms.uBlobs, blobData);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    // Ratchet, one-way, and only once the page has stopped settling.
    if (now - firstFrameAt > WARMUP_MS && frameTimes.length >= 30) {
      const mean = rollingMean();
      if (mean > FRAME_BUDGET_MS) {
        if (!breachStartAt) breachStartAt = now;
        else if (now - breachStartAt >= BREACH_MS) {
          stepDown("sustained frame-time breach", mean);
        }
      } else {
        breachStartAt = 0;
      }
    }

    raf = requestAnimationFrame(frame);
  }

  let activeBlobs = 0;

  function pump() {
    const run = alive && visible && !contextLost && !document.hidden;
    if (run && !raf) {
      lastFrameAt = 0;
      raf = requestAnimationFrame(frame);
    }
    if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function onPointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const now = performance.now();
    if (head && lastMoveAt) {
      const dt = (now - lastMoveAt) / 1000;
      if (dt > 0) {
        const v = Math.hypot(x - head.x, y - head.y) / dt;
        velocity = velocity + (v - velocity) * VEL_SMOOTH;
      }
    }
    lastMoveAt = now;
    head = { x, y };
    lastInput = now;
    emitTo(x, y, now);
  }

  function onLost(e: Event) {
    e.preventDefault();
    contextLost = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    console.warn("[hero] webgl context lost");
  }

  function onRestored() {
    try {
      texBase = makeTexture(gl!, base);
      texChrome = makeTexture(gl!, chrome);
      program = null;
      buildProgram(tierIndex);
      contextLost = false;
      resize();
      firstFrameAt = 0;
      pump();
      console.info("[hero] webgl context restored");
    } catch (err) {
      console.error("[hero] context restore failed", err);
      onFailure();
    }
  }

  function onVisibility() {
    pump();
  }

  /**
   * A rotation changes viewport, DPR-effective load and often which device
   * class the heuristic would pick. Re-guess, but never *raise* quality above a
   * tier that measurement already rejected — the ratchet stays one-way.
   */
  function onOrientation() {
    resize();
    const guess = guessTier();
    if (guess > tierIndex) {
      const from = TIERS[tierIndex].name;
      tierIndex = guess;
      try {
        buildProgram(tierIndex);
      } catch (err) {
        console.error("[hero] orientation rebuild failed", err);
        onFailure();
        return;
      }
      resize();
      firstFrameAt = performance.now();
      breachStartAt = 0;
      frameTimes.length = 0;
      console.info(
        `[hero] tier ${from} -> ${TIERS[tierIndex].name}: orientation change re-evaluated the initial tier`
      );
    }
  }

  resize();
  canvas.addEventListener("webglcontextlost", onLost as EventListener);
  canvas.addEventListener("webglcontextrestored", onRestored);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("orientationchange", onOrientation);
  document.addEventListener("visibilitychange", onVisibility);
  pump();

  return {
    resize,
    setPointer(x, y) {
      head = { x, y };
      lastInput = performance.now();
      emitTo(x, y, lastInput);
    },
    setVisible(on) {
      visible = on;
      pump();
    },
    setTuning(t) {
      Object.assign(tune, t);
    },
    stats() {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
      const mean = rollingMean();
      return {
        meanMs: mean,
        p95Ms: p95,
        fps: mean > 0 ? 1000 / mean : 0,
        tierIndex,
        tierName: tierOf(tierIndex).name,
        resScale: tierOf(tierIndex).resScale,
        octaves: tierOf(tierIndex).octaves,
        maxBlobs,
        activeBlobs,
        blobCeiling,
        baseRadiusPx: baseR,
        warmingUp: performance.now() - firstFrameAt < WARMUP_MS,
        tune: { ...tune },
      };
    },
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      if (program) gl!.deleteProgram(program);
      gl!.deleteBuffer(quad);
      gl!.deleteTexture(texBase);
      gl!.deleteTexture(texChrome);
    },
  };
}

function noopHandle(): Handle {
  return {
    resize() {},
    setPointer() {},
    setVisible() {},
    setTuning() {},
    stats() {
      return {
        meanMs: 0,
        p95Ms: 0,
        fps: 0,
        tierIndex: 0,
        tierName: "none",
        resScale: 0,
        octaves: 0,
        maxBlobs: 0,
        activeBlobs: 0,
        blobCeiling: 0,
        baseRadiusPx: 0,
        warmingUp: false,
        tune: { ...DEFAULT_TUNING },
      };
    },
    destroy() {},
  };
}
