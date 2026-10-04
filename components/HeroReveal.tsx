"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createLiquidGlass, type Handle, type Stats } from "./hero/liquid-glass";
import { HandNote } from "./ui-paper/HandNote";
import { PaperClip, Tape } from "./ui-paper/Attachments";
import { Sticker } from "./ui-paper/Sticker";
import {
  HeroProbe,
  readTierOverrides,
  readTuningOverrides,
  useDevFlags,
  useProbeEnabled,
} from "./hero/HeroProbe";

/**
 * The hero. Two pixel-aligned plates of the same portrait: the chrome helmet
 * underneath, the real face on top. The pointer opens an amoebic liquid-glass
 * mass in the top plate — organic lobed edges, blobs that merge and separate —
 * and it heals shut over roughly a second.
 *
 * Rendered by a WebGL fragment shader (`hero/liquid-glass.ts`, `hero/glsl.ts`).
 * It was previously Canvas2D stamp-and-heal, which produced a circular hole.
 * The reason for the rewrite is not performance, it is that the old pipeline
 * erased into an *alpha mask*: a mask carries coverage, so the boundary could
 * only ever be a clean cut. The shader evaluates a signed distance *field*, and
 * distance is what lets the edge be bent — refraction, chromatic aberration and
 * specular all come off the field's gradient instead of being approximated with
 * offset redraws.
 *
 * FIT MATH lives in liquid-glass.ts and is unchanged, derived by measuring the
 * plates rather than assuming 16:9:
 *   plate            2688 x 1520  (aspect 1.7684, not 1.7778)
 *   subject spans    x 812..1940  -> 1128px wide, centre x 0.512
 *   face centre      y 613        -> 0.403 of height
 *
 * Pure cover-fit makes the head enormous on a phone; fit-to-width makes it
 * tiny. Instead the scale is capped so the subject always occupies ~90% of the
 * viewport width, and the leftover is left as black. That is free here because
 * the studio backdrop is literally #000000, sampled from all four corners.
 *
 * REDESIGN 2026-10: the page is light now, so the portrait no longer fills the
 * screen. It sits inside a framed print on grid paper, and "the viewport" the
 * fit math sees is the photo window (the engine measures `wrap`, never the
 * window). The letterbox is still invisible because the window's own ground is
 * the same studio black. The engine, the shader and the fit constants are
 * untouched; only the markup around them changed.
 */

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

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Module-level store so the client's first snapshot is `false`, matching
 * getServerSnapshot. Returning mq.matches straight from getSnapshot would
 * disagree with the server for anyone who has reduced motion on, which
 * useSyncExternalStore reports as a hydration error. The media query is read
 * after commit and published through the subscription instead.
 */
let reducedMotion = false;
const reducedListeners = new Set<() => void>();

function publishReduced(value: boolean) {
  if (value === reducedMotion) return;
  reducedMotion = value;
  for (const l of reducedListeners) l();
}

function subscribeReduced(cb: () => void) {
  reducedListeners.add(cb);
  const mq = window.matchMedia(REDUCED_QUERY);
  const on = () => publishReduced(mq.matches);
  mq.addEventListener("change", on);
  queueMicrotask(on);
  return () => {
    reducedListeners.delete(cb);
    mq.removeEventListener("change", on);
  };
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => reducedMotion, () => false);
}

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.decoding = "async";
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

export function HeroReveal({
  headline,
  supporting,
  mechanism,
  proof,
  children,
}: {
  /** A node, so a phrase inside it can carry a Highlighter. */
  headline: React.ReactNode;
  /** The reader's situation. */
  supporting: string;
  /** What I do, one sentence. Shares a paragraph with `supporting` so the
   *  hero stays at four blocks. */
  mechanism: string;
  /** Checkable evidence. One line, text and a link. */
  proof?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plateRef = useRef<HTMLImageElement>(null);
  const engineRef = useRef<Handle | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const probeOn = useProbeEnabled();
  const dev = useDevFlags();

  useEffect(() => {
    if (reduced || failed) return;
    // The flags resolve one microtask after mount, so the canvas is briefly
    // present before they apply. Without them in the dependency list the engine
    // would start, the canvas would then unmount, and the loop would keep
    // running against a detached element with no teardown.
    if (dev.nocanvas || dev.plateonly) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let alive = true;
    let engine: Handle | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;

    Promise.all([load(pickSrc("base")), load(pickSrc("chrome"))])
      .then(([base, chrome]) => {
        if (!alive) return;
        engine = createLiquidGlass({
          canvas,
          wrap,
          base,
          chrome,
          tuning: readTuningOverrides(),
          overrides: readTierOverrides(),
          // Any unrecoverable GL problem falls through to the same static plate
          // the reduced-motion branch uses. There is one fallback, not two.
          onFailure: () => setFailed(true),
        });
        engineRef.current = engine;
        setReady(true);

        ro = new ResizeObserver(() => engine?.resize());
        ro.observe(wrap);

        // The hero is one screen of a long page. Without this the shader keeps
        // running while the visitor reads the case studies far below it.
        io = new IntersectionObserver(
          ([e]) => engine?.setVisible(e.isIntersecting),
          { threshold: 0 }
        );
        io.observe(wrap);
      })
      .catch(() => {
        // Plates unavailable: fall back to the static <picture>, same as above.
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
      ro?.disconnect();
      io?.disconnect();
      engine?.destroy();
      engineRef.current = null;
    };
  }, [reduced, failed, dev.nocanvas, dev.plateonly]);

  const getStats = useCallback<() => Stats | null>(
    () => engineRef.current?.stats() ?? null,
    []
  );

  /**
   * Publish the navbar's measured height as --hero-nav-h.
   *
   * The copy column had no allowance for the fixed navbar at lg. It used
   * justify-center, which centres content in the padding box and, when the
   * content is taller than that box, overflows it at BOTH ends: at 1337x594
   * the first headline line rose to the same y as the nav wordmark. The
   * padding below is derived from this measurement rather than a hard 64px,
   * so a nav that changes height cannot silently reintroduce the collision.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const nav = document.querySelector<HTMLElement>("nav, header");
    if (!nav) return;
    const apply = () =>
      section.style.setProperty("--hero-nav-h", `${nav.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  /**
   * Bisect instrumentation for the portrait paint issue. Dev only.
   *
   * Geometry has been computed correct at every width and the plate has never
   * been observed painting, so this stops reasoning and reports the facts:
   * which source the <picture> actually resolved, whether the bytes decoded,
   * and what the canvas opacity is at the moment the plate is ready. Re-runs
   * when `ready` flips so the canvas value is captured at first paint.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const img = plateRef.current;
    const canvas = canvasRef.current;
    const snap = (phase: string, decode: string) =>
      console.info(`[hero] ${phase}`, {
        resolvedSrc: img?.currentSrc || img?.src || null,
        naturalWidth: img?.naturalWidth ?? null,
        naturalHeight: img?.naturalHeight ?? null,
        imgComplete: img?.complete ?? null,
        decode,
        canvasMounted: !!canvas,
        canvasOpacity: canvas ? getComputedStyle(canvas).opacity : null,
        canvasBacking: canvas ? `${canvas.width}x${canvas.height}` : null,
        ready,
      });

    if (!img) {
      snap("plate", "no <img> element mounted");
      return;
    }
    let cancelled = false;
    img
      .decode()
      .then(() => {
        if (!cancelled) snap("plate decode", "resolved");
      })
      .catch((e: unknown) => {
        if (!cancelled)
          snap("plate decode", `rejected: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, reduced, failed, dev.plateonly, dev.nocanvas]);

  const staticPlate = reduced || failed;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="paper-scope relative isolate overflow-hidden bg-grid-paper text-ink"
    >
      {/* Layout. Phones read headline, then the photo, then the copy and the
          buttons. From lg the copy is one column on the left and the framed
          photo sits beside it. The copy wrapper is `display: contents` below
          lg so its two blocks can be ordered around the photo without
          duplicating any markup. */}
      <div
        className={`mx-auto flex w-full max-w-[1320px] flex-col gap-9 px-4 pb-16 pt-[calc(var(--hero-nav-h,4rem)_+_1.75rem)] sm:px-6 md:pb-20 lg:grid lg:min-h-[min(100svh,1000px)] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-center lg:gap-x-14 lg:px-10 lg:pb-14 lg:pt-[calc(var(--hero-nav-h,4.5rem)_+_2rem)] `}
      >
        <div className={dev.plateonly ? "hidden" : "contents lg:block"}>
          <div className="order-1">
            {/* Type sized against the measured width of the condensed Didone:
                three lines at every breakpoint from 375 up. The lg step keeps
                an svh term so a wide-but-short window cannot push the buttons
                off the bottom. */}
            <h1
              id="hero-heading"
              className="font-didone text-[clamp(3.2rem,14.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-ink text-balance sm:text-[clamp(4rem,10vw,5.4rem)] lg:text-[clamp(3.8rem,min(6.4vw,10.5svh),6rem)]"
            >
              {headline}
            </h1>
          </div>

          <div className="order-3 lg:mt-9">
            <p className="max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-soft lg:text-lg">
              {supporting} {mechanism}
            </p>
            {proof ? (
              <p className="mt-3 font-display text-lg font-bold tracking-[-0.01em] text-ink">{proof}</p>
            ) : null}
            {children ? <div className="mt-9 w-full">{children}</div> : null}
          </div>
        </div>

        {/* THE PRINT. The portrait and the shader are unchanged; only the
            container moved. It is a framed photo object on the paper now:
            ink frame, white mat, a tilted gold sheet behind it, tape and a
            clip, and a handwritten note in the bottom margin.

            The frame itself is never rotated or transformed. The engine sizes
            the canvas from wrap.getBoundingClientRect() and maps the pointer
            from canvas.getBoundingClientRect(); any transform on an ancestor
            would inflate both rects to the rotated bounding box. All tilt and
            entrance motion lives on the sibling layers around it instead.

            Letterbox: inside a frame narrower than 1024px the fit takes its
            narrow branch (min of cover, 90% subject width, crown-to-shoulder
            height). At the 4:5 and 5:6 windows used here that leaves at most
            ~11px of plate edge above the crown, and the plate edge is the
            studio's own #000, so the window reads as one photograph. */}
        <div className="relative order-2 mx-auto w-full max-w-[520px] sm:max-w-[540px] lg:mx-0 lg:ml-auto lg:max-w-[min(100%,calc((min(100svh,1000px)_-_var(--hero-nav-h,4.5rem)_-_12rem)_/_1.2))]">
          <div
            aria-hidden="true"
            className="load-tilt absolute inset-0 border-[3px] border-ink bg-gold [rotate:3.5deg] [translate:12px_10px] sm:[translate:16px_12px]"
            style={{ "--rv-delay": "120ms" } as React.CSSProperties}
          />

          <figure className="relative m-0 border-[3px] border-ink bg-paper p-2.5 pb-0 shadow-brutal-lg sm:p-3.5 sm:pb-0">
            <div
              ref={wrapRef}
              className="relative aspect-[4/5] w-full overflow-hidden border-[3px] border-ink bg-black lg:aspect-[5/6]"
              style={{ touchAction: "pan-y" }}
            >
              {/* The plate is ALWAYS rendered, as the ground the canvas sits
                  on. It used to render only when reduced-motion or an explicit
                  failure flipped the branch, which meant a WebGL init that
                  *hung* rather than threw hit neither: `ready` stayed false,
                  the canvas held opacity-0, and the hero had nothing in it.
                  The subject is the reason this hero exists; it cannot depend
                  on a GPU path succeeding.

                  The canvas paints its own black outside the plate rect, so
                  once it fades in it occludes this entirely. The two differ by
                  a few percent of scale (object-cover here vs the width-capped
                  fit there), visible only as a slight settle during the
                  one-time 700ms fade. */}
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
                  ref={plateRef}
                  src="/hero/king-base-1600.png"
                  alt="Portrait of Big Quiv, founder of BigQuiv Digitals, against a black studio backdrop."
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: "51.2% 40.3%" }}
                  fetchPriority="high"
                />
              </picture>
              {!staticPlate && !dev.nocanvas && !dev.plateonly && (
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
                />
              )}
            </div>

            <figcaption className="flex min-h-[64px] items-center justify-center py-3 sm:min-h-[76px]">
              {staticPlate ? (
                <span className="font-hand text-[1.6rem] font-bold leading-none text-ink">Big Quiv, founder</span>
              ) : (
                <HandNote load delay={900} arrow="up" arrowAt="start" tilt={-2} size="sm" arrowClassName="!w-[34px] sm:!w-[40px]" className="sm:text-[1.7rem]">
                  <span className="only-pointer">move your cursor over my face</span>
                  <span className="only-touch">drag your finger over my face</span>
                </HandNote>
              )}
            </figcaption>
          </figure>

          {/* Things holding the print to the page. All decorative. */}
          <Tape className="load-settle -top-3.5 left-[12%]" tilt={-7} width={92} />
          <PaperClip className="-top-8 right-[16%]" tilt={10} />
          <Sticker
            shape="wavy"
            tone="soft"
            size={44}
            tilt={-9}
            reveal={false}
            delay={520}
            className="load-settle absolute -left-3 top-[38%] sm:-left-9"
          >
            hi, i&apos;m big quiv
          </Sticker>
          <Sticker
            shape="starburst"
            tone="gold"
            size={96}
            tilt={12}
            reveal={false}
            delay={680}
            className="load-settle absolute -right-3 bottom-[14%] sm:-right-8"
          >
            {staticPlate ? null : "try it"}
          </Sticker>
        </div>
      </div>

      {probeOn && !staticPlate ? <HeroProbe getStats={getStats} /> : null}
    </section>
  );
}
