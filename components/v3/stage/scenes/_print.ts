/**
 * Small helpers for objects that carry printed type or real screens
 * (systemCube, storyCards, deviceRack, calendar). Canvas textures only, drawn
 * in the site's own Bricolage once the fonts are ready.
 */
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";

/** The page's Bricolage family (next/font hashes the name), for canvas text. */
export async function displayFont() {
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts API unavailable: fall back below */
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-bricolage").trim();
  return v || "'Bricolage Grotesque', system-ui, sans-serif";
}

export function canvasTexture(c: HTMLCanvasElement, anisotropy = 4): Texture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Draw `img` into the box like `object-fit: cover`, anchored at (ax, ay) 0..1. */
export function drawCover(
  g: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  ax = 0.5,
  ay = 0.5
) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  const sx = (img.width - sw) * ax;
  const sy = (img.height - sh) * ay;
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** A screen texture: the real screenshot, cover-cropped to the screen's shape. */
export async function screenTexture(src: string, aspect: number, maxW: number, ax = 0.5, ay = 0) {
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = maxW;
  c.height = Math.round(maxW / aspect);
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  if (img) drawCover(g, img, 0, 0, c.width, c.height, ax, ay);
  return canvasTexture(c, 8);
}

/**
 * A phone screen from a desktop capture: the page shown at a readable width
 * (`frac` of the capture's width, from `ax`), top aligned, the rest of the
 * screen filled with the page's own bottom colour, like a page scrolled to top.
 */
export async function phoneTexture(src: string, aspect: number, maxW: number, ax = 0.5, frac = 0.55) {
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = maxW;
  c.height = Math.round(maxW / aspect);
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  if (img) {
    const sw = img.width * frac;
    const sx = (img.width - sw) * ax;
    const scale = c.width / sw;
    const dh = Math.min(c.height, img.height * scale);
    // the page's own ground under it
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const pg = probe.getContext("2d")!;
    pg.drawImage(img, Math.round(img.width * 0.5), img.height - 2, 1, 1, 0, 0, 1, 1);
    const [r, gg, b] = pg.getImageData(0, 0, 1, 1).data;
    g.fillStyle = `rgb(${r},${gg},${b})`;
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, sx, 0, sw, dh / scale, 0, 0, c.width, dh);
  }
  return canvasTexture(c, 8);
}
