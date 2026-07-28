"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createLiquidGlass, type Handle, type Stats } from "./hero/liquid-glass";
import {
  HeroProbe,
  readTierOverrides,
  readTuningOverrides,
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
  supportingShort,
  children,
}: {
  headline: string;
  /** Desktop paragraph. */
  supporting: string;
  /** Narrow-viewport variant. A real sentence, not a truncation of the above. */
  supportingShort: string;
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
        {/* The plate is ALWAYS rendered, as the ground the canvas sits on.
            It used to render only when reduced-motion or an explicit failure
            flipped the branch, which meant a WebGL init that *hung* rather than
            threw hit neither: `ready` stayed false, the canvas held opacity-0,
            and the hero was black type on nothing. The subject is the reason
            this hero exists; it cannot depend on a GPU path succeeding.

            The canvas paints its own black outside the plate rect, so once it
            fades in it occludes this entirely. The two differ by ~6% of scale
            at narrow widths (object-cover here vs the width-capped fit there),
            visible only as a slight settle during the one-time 700ms fade. */}
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
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "51.2% 40.3%" }}
            fetchPriority="high"
          />
        </picture>
        {!staticPlate && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          />
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
        {/* The "BIGQUIV DIGITALS" eyebrow that sat here is gone. It repeated
            the navbar wordmark verbatim, directly beneath it. */}
        {/* The column was only capped at lg, so the 640-1024 band ran the
            headline to the full 820px of an 900px viewport — a measure no
            headline should have. Capped from sm up. */}
        <div className="w-full sm:max-w-[34rem] lg:max-w-[36rem]">
          {/* Type scale in three real steps rather than one clamp.
              The single clamp floored at 2.1rem, and below ~622px that floor
              won: a 375px phone rendered the same 33.6px as a 620px window, in
              a column 245px narrower, so it wrapped to three lines. The lg step
              keeps the svh term, which is what stops a wide-but-short window
              rendering desktop-size type and pushing the CTAs off the bottom. */}
          <h1
            id="hero-heading"
            className="font-display text-[clamp(1.75rem,7.5vw,2.5rem)] font-bold leading-[0.98] tracking-[-0.025em] text-text-primary text-balance sm:text-[clamp(2.5rem,5.2vw,3.25rem)] sm:leading-[0.96] lg:text-[clamp(3rem,min(5.4vw,10svh),4.5rem)]"
          >
            {headline}
          </h1>

          {/* Two real variants, swapped on the breakpoint. display:none keeps
              the hidden one out of the accessibility tree, so neither is read
              twice. Not a CSS truncation of the long paragraph. */}
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-text-secondary lg:hidden">
            {supportingShort}
          </p>
          <p className="mt-5 hidden max-w-[46ch] text-lg leading-relaxed text-text-secondary lg:block">
            {supporting}
          </p>

          {/* Large gap before the form. The rhythm was near-uniform, so nothing
              grouped: headline and supporting now couple tightly, the form sits
              clearly apart, and its helper text couples tightly back to it. */}
          {children ? <div className="mt-10 w-full md:mt-12">{children}</div> : null}
        </div>
      </div>

      {probeOn && !staticPlate ? <HeroProbe getStats={getStats} /> : null}
    </section>
  );
}
