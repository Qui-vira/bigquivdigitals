/**
 * Type for the textures drawn on the course objects (the book's pages, the
 * phone's screen). Reads the site's own self-hosted faces off the CSS
 * variables next/font sets on <html>, waits for them, and wraps lines.
 */

export type Fonts = { display: string; body: string };

let cached: Promise<Fonts> | null = null;

export function readFonts(): Promise<Fonts> {
  if (cached) return cached;
  cached = (async () => {
    const css = getComputedStyle(document.documentElement);
    const display = css.getPropertyValue("--font-bricolage").trim() || "'Bricolage Grotesque', system-ui, sans-serif";
    const body = css.getPropertyValue("--font-body").trim() || "Karla, system-ui, sans-serif";
    try {
      await Promise.all([
        document.fonts.load(`800 48px ${display}`),
        document.fonts.load(`400 24px ${body}`),
        document.fonts.load(`600 24px ${body}`),
      ]);
    } catch {
      // a missing face falls back to the system sans; the texture still draws
    }
    return { display, body };
  })();
  return cached;
}

/** Draw `text` wrapped to `maxW`, top-left at (x, y). Returns the y after the last line. */
export function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else line = test;
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineH;
  }
  return yy;
}

/** Condensed display width where the canvas supports it. */
export function condensed(ctx: CanvasRenderingContext2D) {
  const c = ctx as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
  if ("fontStretch" in c) c.fontStretch = "semi-condensed";
}

export function normal(ctx: CanvasRenderingContext2D) {
  const c = ctx as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
  if ("fontStretch" in c) c.fontStretch = "normal";
  if ("letterSpacing" in c) c.letterSpacing = "0px";
}

export function tracking(ctx: CanvasRenderingContext2D, px: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = `${px}px`;
}

/** A fine print grain so flat fills read as paper and board, not screen fills. */
export function grain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.035) {
  const n = Math.round((w * h) / 90);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(18,23,34,${alpha})` : `rgba(255,255,255,${alpha * 1.4})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
}
