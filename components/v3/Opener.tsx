"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * The opener, Adewura's loading sequence made short (no sound, so no welcome
 * screen and no Enter button). Spec: research/adewura-motion/BREAKDOWN.md §10.
 *
 * The navy screen and the wordmark are server HTML (OpenerMarkup below), so
 * the very first paint is navy, never a flash of the page. An inline script
 * removes it before paint for returning visitors in the same session, for
 * reduced motion and on /admin. This component then runs:
 *
 *   0.0 to 0.5 s   wordmark fades in and rises 10px
 *   0.5 to 1.1 s   hold
 *   1.1 to 1.8 s   wordmark glides into its place in the nav
 *   if the page's 3D object is not ready: "load ___ ing", one of his work
 *   icons every 380 ms, never past 2.5 s in total
 *   then the navy fades away over 0.6 s
 */

export const OPENER_KEY = "bqd-entered";
const CAP_MS = 2500;
const ICON_MS = 380;

const ICONS = [
  // a video frame
  '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="10" width="38" height="28" rx="3" fill="currentColor"/><rect x="10" y="15" width="28" height="18" rx="1.5" fill="#1B2433"/><path d="M21 19v10l8-5z" fill="currentColor"/></svg>',
  // a chart line
  '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="8" width="38" height="32" rx="3" fill="currentColor"/><path d="M11 33l8-9 6 5 12-14" fill="none" stroke="#1B2433" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
  // a play button
  '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="currentColor"/><path d="M20 15v18l14-9z" fill="#1B2433"/></svg>',
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Server-rendered first paint. Put it first inside <body>. */
export function OpenerMarkup() {
  const skip = `(function(){try{var d=document.documentElement;var r=matchMedia('(prefers-reduced-motion: reduce)').matches;var s=sessionStorage.getItem('${OPENER_KEY}')==='1';if(r||s||location.pathname.indexOf('/admin')===0){d.classList.add('bq-no-opener');}else{d.classList.add('bq-opening');}}catch(e){document.documentElement.classList.add('bq-no-opener');}})();`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: skip }} />
      <div id="bq-opener" aria-hidden="true">
        <span className="bq-opener__mark">
          BigQuiv<span className="bq-opener__sub">Digitals</span>
          <span className="bq-opener__dot">.</span>
        </span>
      </div>
    </>
  );
}

export function Opener() {
  useEffect(() => {
    const root = document.documentElement;
    const overlay = document.getElementById("bq-opener");
    if (!overlay || root.classList.contains("bq-no-opener")) {
      overlay?.remove();
      return;
    }
    const mark = overlay.querySelector<HTMLElement>(".bq-opener__mark")!;
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    lenis?.stop();
    const started = performance.now();

    // ready = fonts in, and the page's 3D object built (or the page has none)
    let stageReady = !document.querySelector(".v3-stage");
    const onStage = () => {
      stageReady = true;
    };
    window.addEventListener("bq:stage-ready", onStage);
    let fontsReady = false;
    document.fonts?.ready.then(() => {
      fontsReady = true;
    });
    const isReady = () => (stageReady && fontsReady) || performance.now() - started > CAP_MS;

    let cancelled = false;
    let finished = false;
    // Watchdog: whatever happens (a stalled font, a background tab), the page
    // is never held for more than 4 s.
    const release = () => {
      if (finished) return;
      finished = true;
      root.classList.remove("bq-opening");
      document.querySelector<HTMLElement>(".v3-nav .v3-wordmark")?.style.removeProperty("visibility");
      try {
        sessionStorage.setItem(OPENER_KEY, "1");
      } catch {}
      lenis?.start();
      window.dispatchEvent(new Event("bq:opener-done"));
    };
    const watchdog = window.setTimeout(() => {
      release();
      overlay.remove();
    }, 4000);
    (async () => {
      await gsap.fromTo(mark, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      await wait(600);
      if (cancelled) return;

      // glide into the nav's wordmark
      const target = document.querySelector<HTMLElement>(".v3-nav .v3-wordmark");
      if (target) {
        const from = mark.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        target.style.visibility = "hidden";
        await gsap.to(mark, {
          x: to.left + to.width / 2 - (from.left + from.width / 2),
          y: to.top + to.height / 2 - (from.top + from.height / 2),
          scale: to.height / from.height,
          duration: 0.7,
          ease: "expo.inOut",
        });
      }

      // still waiting on the 3D: load ___ ing with his work popping into the gap
      if (!isReady()) {
        const loader = document.createElement("div");
        loader.className = "bq-loader";
        loader.innerHTML = '<span class="bq-loader__part">load</span><span class="bq-loader__gap"></span><span class="bq-loader__part">ing</span>';
        overlay.append(loader);
        const gap = loader.querySelector<HTMLElement>(".bq-loader__gap")!;
        gsap.from(loader.querySelectorAll(".bq-loader__part"), { opacity: 0, y: 8, duration: 0.4, ease: "power3.out", stagger: 0.05 });
        let i = 0;
        while (!isReady() && !cancelled) {
          gap.innerHTML = ICONS[i % ICONS.length];
          gsap.fromTo(gap.firstElementChild, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: "back.out(2)" });
          i++;
          await wait(ICON_MS);
        }
        await gsap.to(loader, { opacity: 0, y: -8, duration: 0.3, ease: "power2.in" });
      }

      if (target) target.style.visibility = "";
      mark.style.visibility = "hidden";
      window.clearTimeout(watchdog);
      release();
      await gsap.to(overlay, { opacity: 0, duration: 0.6, ease: "power2.out" });
      overlay.remove();
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      window.removeEventListener("bq:stage-ready", onStage);
    };
  }, []);

  return null;
}
