"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero. Two pixel-aligned plates of the same portrait: the chrome helmet
 * underneath, the real face on top. The pointer erases the top plate along a
 * liquid trail and the hole heals shut over roughly a second.
 *
 * Done on canvas rather than CSS masking, deliberately:
 *   - `radial-gradient(circle 26% at ...)` is invalid CSS. A circle's explicit
 *     size takes a length, never a percentage, so the whole declaration is
 *     dropped and nothing renders.
 *   - `mask-image` has a discrete animation type, so transitions and keyframes
 *     on it do nothing. The easing has to be driven per frame anyway.
 * Canvas sidesteps both and is the only way to get the trailing tail.
 *
 * FIT MATH, derived by measuring the plates rather than assuming 16:9:
 *   plate            2688 x 1520  (aspect 1.7684, not 1.7778)
 *   subject spans    x 812..1940  -> 1128px wide, centre x 0.512
 *   face centre      y 613        -> 0.403 of height
 *
 * Pure cover-fit makes the head enormous on a phone; fit-to-width makes it
 * tiny. Instead the scale is capped so the subject always occupies ~90% of the
 * viewport width, and the leftover is left as black. That is free here because
 * the studio backdrop is literally #000000, sampled from all four corners, and
 * the page ground is the same value, so the letterbox is invisible.
 */

const PLATE_W = 2688;
const PLATE_H = 1520;
const SUBJECT_W = 1128; // measured
const SUBJECT_CX = 0.512; // measured, fraction of plate width
const FACE_CY = 0.403; // measured, fraction of plate height

/** Subject occupies at most this fraction of the viewport width. */
const SUBJECT_TARGET = 0.9;
/** Where the face sits vertically in the viewport. */
const FOCAL_Y = 0.42;

/** Per-frame heal rate. ~0.05 gives roughly a one second settle-back. */
const HEAL_ALPHA = 0.05;

/* Brush size scales with the subject, like the drift amplitudes do.
   It was a fixed 128 CSS px at every viewport. Measured against the head
   (~850px wide in plate space, read off a gridded overlay at eye level) that
   is 63% of the head width on a 1280 viewport and 97% on a 390 one: on a
   phone the brush was the whole face, so nothing read as a circle moving
   across anything. Held at ~45% of head width everywhere instead. */
const HEAD_W = 850; // plate px, measured at eye level
const BRUSH_HEAD_FRAC = 0.225; // radius as a fraction of head width
const BRUSH_MIN = 40;
const BRUSH_MAX = 190;
const FRINGE_ALPHA = 0.3;
const IDLE_MS = 1200;

/* Idle drift. Amplitudes are relative to the SUBJECT, not the viewport, and
   the path is centred on the face the fit actually placed. Orbiting
   cw*0.5 / ch*FOCAL_Y left the brush 205px left of the face on desktop, where
   its maximum x (838) never even reached the face centre (845): the reveal was
   sweeping empty backdrop. Speed raised from ~98 px/s, which was far slower
   than any human sweep and, more importantly, moved the brush only 0.38 of a
   radius during the ~0.75s heal window, hiding the tail underneath itself. */
const DRIFT_AMP_X = 0.42; // of subject width
const DRIFT_AMP_Y = 0.16; // of plate height
const DRIFT_WX = 1.7;
const DRIFT_WY = 1.15;

type Pt = { x: number; y: number };

/**
 * Must stay in lockstep with the <link rel="preload"> media queries in
 * app/layout.tsx. These select on CSS pixels, not device pixels: keying this
 * on innerWidth * devicePixelRatio made a 1440 retina screen preload the 1600
 * pair and then fetch the 2560 pair, downloading the hero twice.
 */
function pickSrc(kind: "base" | "chrome") {
  const w = typeof window === "undefined" ? 1600 : window.innerWidth;
  const step = w > 1600 ? 2560 : w > 900 ? 1600 : 1024;
  return `/hero/king-${kind}-${step}.avif`;
}

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

export function HeroReveal({
  kicker,
  headline,
  supporting,
  children,
}: {
  kicker: string;
  headline: string;
  supporting: string;
  children?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let raf = 0;
    let alive = true;
    let base: HTMLImageElement, chrome: HTMLImageElement;

    // offscreen: the top plate we punch holes in, and the fringe accumulator
    const off = document.createElement("canvas");
    const fringe = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const octx = off.getContext("2d");
    const fctx = fringe.getContext("2d");
    if (!ctx || !octx || !fctx) return;

    let dpr = 1, cw = 0, ch = 0;
    let fit = { dx: 0, dy: 0, dw: 0, dh: 0, scale: 1 };
    let brushR = 128;
    let prev: Pt | null = null;
    let cur: Pt | null = null;
    let lastInput = 0;
    let t = 0;

    function computeFit() {
      const cover = Math.max(cw / PLATE_W, ch / PLATE_H);
      // Cap so the subject never exceeds SUBJECT_TARGET of the viewport width.
      const capped = (SUBJECT_TARGET * cw) / SUBJECT_W;
      const scale = Math.min(cover, capped);
      const dw = PLATE_W * scale;
      const dh = PLATE_H * scale;

      // Where the subject's centre sits horizontally in the viewport.
      //
      // Centred on narrow screens, where the plate letterboxes and the copy
      // lives in the black below it. Pushed right on wide screens so the left
      // third stays empty for the headline: centred + wide put the copy
      // straight across the mouth, which the whole hero is meant to avoid.
      const wide = cw >= 1024;
      const anchorX = wide ? 0.66 : 0.5;
      const anchorY = wide ? 0.5 : FOCAL_Y;

      fit = {
        scale,
        dw,
        dh,
        dx: cw * anchorX - SUBJECT_CX * dw,
        dy: ch * anchorY - FACE_CY * dh,
      };

      brushR = Math.max(BRUSH_MIN, Math.min(BRUSH_MAX, HEAD_W * BRUSH_HEAD_FRAC * scale));
    }

    function resize() {
      const r = wrap!.getBoundingClientRect();
      // A canvas with an unsized parent renders nothing and throws no error,
      // so fall back to the viewport rather than silently painting a 0x0.
      cw = Math.max(1, Math.round(r.width || window.innerWidth));
      ch = Math.max(1, Math.round(r.height || window.innerHeight));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [canvas!, off, fringe]) {
        c.width = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
      }
      canvas!.style.width = `${cw}px`;
      canvas!.style.height = `${ch}px`;
      for (const c of [ctx!, octx!, fctx!]) c.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeFit();
      // repaint the top plate solid after a resize
      octx!.globalCompositeOperation = "source-over";
      octx!.globalAlpha = 1;
      octx!.clearRect(0, 0, cw, ch);
      if (base) octx!.drawImage(base, fit.dx, fit.dy, fit.dw, fit.dh);
      fctx!.clearRect(0, 0, cw, ch);
    }

    function stamp(x: number, y: number) {
      // erase the top plate
      octx!.globalCompositeOperation = "destination-out";
      octx!.globalAlpha = 1;
      const g = octx!.createRadialGradient(x, y, 0, x, y, brushR);
      // Core is fully opaque so one stamp clears the centre outright. At 0.85
      // a single stamp left 15% of the face on top and both layers showed at
      // once. Softness belongs in the falloff.
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.42, "rgba(0,0,0,0.72)");
      g.addColorStop(0.72, "rgba(0,0,0,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      octx!.fillStyle = g;
      octx!.beginPath();
      octx!.arc(x, y, brushR, 0, Math.PI * 2);
      octx!.fill();

      // warm ring just inside the brush edge -> the chromatic fringe
      fctx!.globalCompositeOperation = "lighter";
      const r0 = brushR * 0.62;
      const ring = fctx!.createRadialGradient(x, y, r0, x, y, brushR * 1.04);
      ring.addColorStop(0, "rgba(232,163,61,0)");
      ring.addColorStop(0.45, "rgba(232,163,61,0.5)");
      ring.addColorStop(0.72, "rgba(231,187,136,0.28)");
      ring.addColorStop(1, "rgba(120,180,255,0)");
      fctx!.fillStyle = ring;
      fctx!.beginPath();
      fctx!.arc(x, y, brushR * 1.04, 0, Math.PI * 2);
      fctx!.fill();
    }

    function frame() {
      if (!alive) return;
      t += 1 / 60;

      // heal: redraw the top plate faintly, exponentially closing the holes
      octx!.globalCompositeOperation = "source-over";
      octx!.globalAlpha = HEAL_ALPHA;
      octx!.drawImage(base, fit.dx, fit.dy, fit.dw, fit.dh);
      octx!.globalAlpha = 1;

      // fade the fringe accumulator
      fctx!.globalCompositeOperation = "destination-out";
      fctx!.fillStyle = "rgba(0,0,0,0.12)";
      fctx!.fillRect(0, 0, cw, ch);

      // drift when nobody has touched it, and before first interaction
      if (performance.now() - lastInput > IDLE_MS) {
        const faceX = fit.dx + SUBJECT_CX * fit.dw;
        const faceY = fit.dy + FACE_CY * fit.dh;
        const subjW = SUBJECT_W * (fit.dw / PLATE_W);
        prev = cur;
        cur = {
          x: faceX + Math.cos(t * DRIFT_WX) * subjW * DRIFT_AMP_X,
          y: faceY + Math.sin(t * DRIFT_WY) * fit.dh * DRIFT_AMP_Y,
        };
      }

      // interpolate so a fast flick leaves no gaps in the trail
      if (cur) {
        const from = prev ?? cur;
        const dx = cur.x - from.x;
        const dy = cur.y - from.y;
        // Floor of 2 and tighter spacing: insurance against gaps on a fast
        // flick. Measured stamp count was never the reason the tail was
        // missing at idle, so this is not the fix for that, just correctness.
        const steps = Math.max(2, Math.ceil(Math.hypot(dx, dy) / (brushR * 0.18)));
        for (let i = 1; i <= steps; i++) {
          stamp(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
        }
        prev = cur;
      }

      // composite
      ctx!.globalCompositeOperation = "source-over";
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.drawImage(chrome, fit.dx, fit.dy, fit.dw, fit.dh);
      ctx!.drawImage(off, 0, 0, cw, ch);
      ctx!.globalCompositeOperation = "screen";
      ctx!.globalAlpha = FRINGE_ALPHA;
      ctx!.drawImage(fringe, 0, 0, cw, ch);
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(frame);
    }

    function onPointer(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      prev = cur;
      cur = { x: e.clientX - r.left, y: e.clientY - r.top };
      lastInput = performance.now();
    }

    let onScreen = true;

    function pump() {
      const shouldRun = alive && onScreen && !document.hidden;
      if (shouldRun && !raf) raf = requestAnimationFrame(frame);
      if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function onVisibility() {
      pump();
    }

    Promise.all([load(pickSrc("base")), load(pickSrc("chrome"))])
      .then(([b, c]) => {
        if (!alive) return;
        base = b;
        chrome = c;
        resize();
        setReady(true);
        lastInput = 0;
        pump();
      })
      .catch(() => setReduced(true)); // fall back to the static plate

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // The hero is one screen of a long page. Without this the loop keeps
    // compositing two full-bleed images every frame while the visitor reads
    // the case studies far below it.
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        pump();
      },
      { threshold: 0 }
    );
    io.observe(wrap);
    window.addEventListener("orientationchange", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex h-[100svh] min-h-[520px] w-full flex-col justify-end overflow-hidden bg-bg-primary"
      style={{ touchAction: "pan-y" }}
    >
      <div ref={wrapRef} className="absolute inset-0 h-full w-full">
        {reduced ? (
          <picture>
            <source
              type="image/avif"
              srcSet="/hero/king-base-1024.avif 1024w, /hero/king-base-1600.avif 1600w, /hero/king-base-2560.avif 2560w"
              sizes="100vw"
            />
            <source
              type="image/webp"
              srcSet="/hero/king-base-1024.webp 1024w, /hero/king-base-1600.webp 1600w, /hero/king-base-2560.webp 2560w"
              sizes="100vw"
            />
            <img
              src="/hero/king-base-1600.png"
              alt="Portrait of Big Quiv, founder of BigQuiv Digitals, against a black studio backdrop."
              className="h-full w-full object-cover"
              style={{ objectPosition: "51.2% 40.3%" }}
              fetchPriority="high"
            />
          </picture>
        ) : (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {/* Screen readers get the description the canvas cannot carry. */}
        {!reduced && (
          <p className="sr-only">
            Portrait of Big Quiv against a black studio backdrop. Moving the pointer
            across the image reveals a black helmet with warm gold light seams
            beneath.
          </p>
        )}
      </div>

      {/* Legibility scrim, shaped to wherever the copy actually is.
          A blanket 62% band was swallowing the face on portrait viewports,
          which defeats the point of a portrait hero. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[42%] lg:hidden"
        style={{
          background:
            "linear-gradient(to top, #000 0%, #000 34%, rgba(0,0,0,0.72) 62%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[72%] lg:block"
        style={{
          background:
            "linear-gradient(to right, #000 0%, rgba(0,0,0,0.88) 34%, rgba(0,0,0,0.45) 66%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Copy: bottom-anchored on phones, a left column beside the subject on
          desktop. Never over the face at either size. */}
      {/* pt clears the fixed navbar, which is h-16 (64px). With no top padding
          the kicker sat hard under the wordmark with nothing between them. */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-6 pt-28 pb-14 md:px-10 md:pt-32 lg:justify-center lg:pb-0">
        <div className="w-full lg:max-w-[36rem]">
          <p className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-accent">
            {kicker}
          </p>
          <h1
            id="hero-heading"
            className="mt-7 font-display text-[clamp(2.1rem,5.4vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.025em] text-text-primary text-balance"
          >
            {headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-text-secondary md:text-lg">
            {supporting}
          </p>
          {children ? <div className="mt-9 flex flex-wrap gap-4">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
