"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createLiquidGlass, type Handle, type Stats } from "./hero/liquid-glass";
import { HeroProbe, readTuningOverrides, useProbeEnabled } from "./hero/HeroProbe";

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
 * the studio backdrop is literally #000000, sampled from all four corners, and
 * the page ground is the same value, so the letterbox is invisible.
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

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * useSyncExternalStore rather than an effect that calls setState: the server
 * snapshot is false so the hydration render matches, and there is no cascading
 * render on mount.
 */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
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
  const engineRef = useRef<Handle | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const probeOn = useProbeEnabled();

  useEffect(() => {
    if (reduced || failed) return;
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
  }, [reduced, failed]);

  const getStats = useCallback<() => Stats | null>(
    () => engineRef.current?.stats() ?? null,
    []
  );

  const staticPlate = reduced || failed;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex h-[100svh] min-h-[520px] w-full flex-col justify-end overflow-hidden bg-bg-primary"
      style={{ touchAction: "pan-y" }}
    >
      <div ref={wrapRef} className="absolute inset-0 h-full w-full">
        {staticPlate ? (
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
        {!staticPlate && (
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
          the kicker sat hard under the wordmark with nothing between them.
          At lg the block is vertically centred anyway, so 128px of that is
          spent rather than used; 80px still leaves 16px under the navbar and
          buys back the room a short window needs to fit the CTAs. */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-6 pt-28 pb-14 md:px-10 md:pt-32 lg:justify-center lg:pt-20 lg:pb-0">
        <div className="w-full lg:max-w-[36rem]">
          <p className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-accent">
            {kicker}
          </p>
          {/* The size term was 5.4vw, keyed to viewport WIDTH alone. A wide but
              short window (1360x614 on a laptop with browser chrome) therefore
              rendered 73px type inside a 614px-tall hero and pushed the CTAs
              off the bottom edge. Adding the svh term makes a short viewport
              shrink the display size; on any normal window min() still picks
              the vw term, so nothing changes there. */}
          <h1
            id="hero-heading"
            className="mt-7 font-display text-[clamp(2.1rem,min(5.4vw,10svh),4.5rem)] font-bold leading-[0.96] tracking-[-0.025em] text-text-primary text-balance"
          >
            {headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-text-secondary md:text-lg">
            {supporting}
          </p>
          {children ? <div className="mt-9 flex flex-wrap gap-4">{children}</div> : null}
        </div>
      </div>

      {probeOn && !staticPlate ? <HeroProbe getStats={getStats} /> : null}
    </section>
  );
}
