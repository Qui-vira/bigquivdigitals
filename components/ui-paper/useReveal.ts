"use client";

import { useEffect, useRef } from "react";

/**
 * Entrance trigger for paper primitives.
 *
 * Writes `data-reveal` straight onto the element instead of holding React
 * state, so a reveal never re-renders anything. The CSS lives in
 * app/globals.css under "Reveal states".
 *
 * The rule it enforces: the default, unarmed element is the FINISHED element.
 *   - server render, no JS, reduced motion, no IntersectionObserver, or
 *     automation (navigator.webdriver, like useInkEntrance): never armed,
 *     renders finished, so a full-page capture shows the resting state.
 *   - already on screen when it mounts: never armed either. Above-the-fold
 *     motion belongs to the page-load classes (.load-*), not to this hook, so
 *     nothing visible on arrival ever jumps into a pre-pose.
 *   - below the fold at mount: armed (pre-pose, unseen), then "in" once it
 *     scrolls into view, which plays the entrance one time.
 *
 * On 2026-07-25 this site shipped ~2,950px of blank page because reveals
 * gated visibility on a trigger that never fired. This hook cannot do that:
 * the worst case is an element that stays armed off screen, and armed states
 * are transforms and stroke offsets, never opacity.
 */
export function useReveal<T extends Element = HTMLElement>(rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (navigator.webdriver) return;

    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;

    el.setAttribute("data-reveal", "armed");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.setAttribute("data-reveal", "in");
            io.disconnect();
          }
        }
      },
      { rootMargin, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return ref;
}
