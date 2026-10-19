/**
 * The phone, as a model other scenes can place: a bone body on an ash frame,
 * a white screen inset with rounded corners, a navy notch, a camera bump on
 * the back. Matte materials only; the screen is unlit because a screen is its
 * own light, and nothing glows past its edge.
 *
 * Two screen modes:
 *   films   the AI Mastery player from the comp: a label, the film boxed on a
 *           navy player ground, a gold progress line, title and runtime. The
 *           film shown is chosen by `setFilm(i)`. With `video` on, the active
 *           film's real file plays muted in the box (desktop only, one at a
 *           time, never before the stage is on screen).
 *   screen  one real image (or a video) full bleed, for UGC.
 *
 * Landscape (`setLandscape(1)`) draws the film full screen, turned so it reads
 * upright when the phone lies on its side.
 */
import {
  CanvasTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { readFonts } from "./paperType";

export type PhoneFilm = { img: string; title?: string; runtime?: string; video?: string };

export type PhoneModelOpts = {
  lowPower: boolean;
  reduced: boolean;
  films?: PhoneFilm[];
  screen?: string;
  label?: string;
  /** play the active film's real file in the screen (desktop, motion allowed) */
  video?: boolean;
  anisotropy?: number;
};

export const PHONE = { W: 0.74, H: 1.52, D: 0.085 };

const NAVY = "#1B2433";
const NAVY2 = "#26324A";
const INK2 = "#4A5263";
const GOLD = "#E8A33D";

function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ShapeGeometry(s, 10);
  // map UVs to 0..1 over the rectangle so a texture covers it exactly
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  uv.needsUpdate = true;
  return g;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

const isVideo = (src?: string) => !!src && /\.(mp4|webm|mov)(\?|$)/i.test(src);

/** Fit a source of size sw x sh into a box; cover fills, contain letterboxes. */
function fit(sw: number, sh: number, bw: number, bh: number, cover: boolean) {
  const k = cover ? Math.max(bw / sw, bh / sh) : Math.min(bw / sw, bh / sh);
  const w = sw * k;
  const h = sh * k;
  return { w, h, x: (bw - w) / 2, y: (bh - h) / 2 };
}

export async function buildPhone(opts: PhoneModelOpts) {
  const { W, H, D } = PHONE;
  const group = new Group();
  const seg = opts.lowPower ? 3 : 6;
  const frame = new Mesh(
    new RoundedBoxGeometry(W, H, D, seg, 0.1),
    new MeshStandardMaterial({ color: 0xa39c93, roughness: 0.55, metalness: 0.05 })
  );
  group.add(frame);

  // bone front plate and back plate, just proud of the frame
  const plateGeo = roundedRect(W - 0.012, H - 0.012, 0.094);
  const bone = new MeshStandardMaterial({ color: 0xf2ede7, roughness: 0.8 });
  const front = new Mesh(plateGeo, bone);
  front.position.z = D / 2 + 0.0008;
  const back = new Mesh(plateGeo, bone);
  back.rotation.y = Math.PI;
  back.position.z = -D / 2 - 0.0008;
  group.add(front, back);

  // camera bump on the back
  const bump = new Mesh(
    new RoundedBoxGeometry(0.2, 0.2, 0.02, 2, 0.05),
    new MeshStandardMaterial({ color: 0x26324a, roughness: 0.7 })
  );
  bump.position.set(-W / 2 + 0.17, H / 2 - 0.17, -D / 2 - 0.01);
  group.add(bump);

  // the screen: a canvas the scene redraws when something changes
  const SW = W - 0.07;
  const SH = H - 0.07;
  const cw = opts.lowPower ? 320 : 480;
  const ch = Math.round((cw * SH) / SW);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.anisotropy = opts.anisotropy ?? 1;
  const screenMat = new MeshBasicMaterial({ map: tex, color: 0xf6f6f6 });
  const screen = new Mesh(roundedRect(SW, SH, 0.07), screenMat);
  screen.position.z = D / 2 + 0.0018;
  group.add(screen);

  const fonts = await readFonts();
  const films = opts.films ?? [];
  const images = await Promise.all(films.map((f) => loadImage(f.img)));
  const still = opts.screen && !isVideo(opts.screen) ? await loadImage(opts.screen) : null;

  let film = 0;
  let land = 0;
  let dirty = true;
  let video: HTMLVideoElement | null = null;
  let videoFor = -1;
  const canPlay =
    !!opts.video &&
    !opts.lowPower &&
    !opts.reduced &&
    !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

  function ensureVideo(src: string | undefined, key: number) {
    if (!canPlay || !src) {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video = null;
        videoFor = -1;
      }
      return;
    }
    if (videoFor === key && video) return;
    if (!video) {
      video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.preload = "auto";
    }
    videoFor = key;
    video.src = src;
    video.play().catch(() => {});
  }

  const frameSource = (): { el: CanvasImageSource; w: number; h: number } | null => {
    if (video && video.readyState >= 2 && video.videoWidth) return { el: video, w: video.videoWidth, h: video.videoHeight };
    const im = opts.screen ? still : images[film];
    return im ? { el: im, w: im.naturalWidth, h: im.naturalHeight } : null;
  };

  function notch() {
    ctx.fillStyle = NAVY;
    const nw = cw * 0.27;
    const nh = cw * 0.072;
    ctx.beginPath();
    ctx.roundRect((cw - nw) / 2, cw * 0.036, nw, nh, nh / 2);
    ctx.fill();
  }

  function drawPlayer() {
    const f = films[film];
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, cw, ch);
    notch();
    const pad = cw * 0.067;
    ctx.fillStyle = NAVY;
    ctx.font = `800 ${Math.round(cw * 0.056)}px ${fonts.display}`;
    ctx.textBaseline = "alphabetic";
    if (opts.label) ctx.fillText(opts.label, pad, cw * 0.2);
    // the player box
    const bx = pad;
    const by = cw * 0.27;
    const bw = cw - pad * 2;
    const bh = ch - by - cw * 0.34;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, cw * 0.018);
    ctx.clip();
    ctx.fillStyle = NAVY;
    ctx.fillRect(bx, by, bw, bh);
    const src = frameSource();
    if (src) {
      const r = fit(src.w, src.h, bw, bh, false);
      ctx.drawImage(src.el, bx + r.x, by + r.y, r.w, r.h);
    }
    ctx.restore();
    // progress
    const py = by + bh + cw * 0.09;
    ctx.fillStyle = "rgba(27,36,51,0.14)";
    ctx.fillRect(pad, py, bw, Math.max(2, cw * 0.009));
    let prog = 0.38;
    if (video && video.duration) prog = video.currentTime / video.duration;
    ctx.fillStyle = GOLD;
    ctx.fillRect(pad, py, bw * prog, Math.max(2, cw * 0.009));
    // title and runtime
    ctx.fillStyle = INK2;
    ctx.font = `600 ${Math.round(cw * 0.04)}px ${fonts.body}`;
    const ty = py + cw * 0.1;
    if (f?.title) ctx.fillText(f.title, pad, ty);
    if (f?.runtime) {
      const tw = ctx.measureText(f.runtime).width;
      ctx.fillText(f.runtime, cw - pad - tw, ty);
    }
  }

  function drawLandscape() {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, cw, ch);
    const src = frameSource();
    if (!src) return;
    // the content is drawn turned a quarter so it reads upright on its side
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(Math.PI / 2);
    const r = fit(src.w, src.h, ch, cw, false);
    ctx.drawImage(src.el, -ch / 2 + r.x, -cw / 2 + r.y, r.w, r.h);
    ctx.restore();
  }

  function drawFull() {
    ctx.fillStyle = NAVY2;
    ctx.fillRect(0, 0, cw, ch);
    const src = frameSource();
    if (src) {
      const r = fit(src.w, src.h, cw, ch, true);
      ctx.drawImage(src.el, r.x, r.y, r.w, r.h);
    }
    notch();
  }

  function draw() {
    if (opts.screen) drawFull();
    else if (land > 0.5) drawLandscape();
    else drawPlayer();
    tex.needsUpdate = true;
  }

  if (opts.screen && isVideo(opts.screen)) ensureVideo(opts.screen, 0);
  draw();

  let since = 0;
  return {
    group,
    height: H,
    width: W,
    setFilm(i: number) {
      const n = Math.max(0, Math.min(films.length - 1, i));
      if (n !== film) {
        film = n;
        dirty = true;
      }
    },
    setLandscape(v: number) {
      const n = v > 0.5 ? 1 : 0;
      if (n !== land) {
        land = n;
        dirty = true;
      }
    },
    /** call when the stage starts and stops so video only plays on screen */
    setActive(on: boolean) {
      if (!on) video?.pause();
      else if (video) video.play().catch(() => {});
    },
    tick(dt: number) {
      if (!opts.screen) ensureVideo(films[film]?.video, film);
      since += dt;
      const live = !!video && !video.paused && video.readyState >= 2;
      if (dirty || (live && since > 1 / 30)) {
        since = 0;
        dirty = false;
        draw();
      }
    },
    dispose() {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video = null;
      }
      tex.dispose();
    },
  };
}
