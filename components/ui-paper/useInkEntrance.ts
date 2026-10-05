"use client";

import { useEffect, useRef } from "react";

/**
 * Entrance for pen marks (HandNote, HandArrow, HandMark), on the Web
 * Animations API instead of CSS classes.
 *
 * WHY NOT THE .rv-write / .rv-stroke CLASSES. Phase 1 shipped notes reading
 * "go o", "soun" and "the re" in every full-page capture. The live page was
 * fine: the entrance had finished. But a CSS animation that has finished is
 * still attached to the element (fill-mode both), and Chrome's beyond-viewport
 * capture re-runs it from frame 0, so the clip-path that "writes" the words
 * came back at 100% hidden. Anything that captures the page (a screenshot, a
 * link preview, a crawler render) could ship a half-written note.
 *
 * So, three rules here:
 *   1. The RESTING state is the plain element. No class, no fill: once an
 *      entrance finishes, the Animation object is gone and nothing can replay.
 *   2. WORDS NEVER HIDE. Their entrance starts from a visible pose (a small
 *      lift and tilt, like ink settling); only decorative strokes draw on.
 *   3. Strokes only pre-pose while off screen, and never under reduced motion
 *      or automation (navigator.webdriver), so a capture always gets the
 *      finished mark.
 *
 * Each target is described by a selector inside the root and the keyframes to
 * play on it. `load` plays on mount (above the fold); otherwise the entrance
 * plays when the root scrolls into view.
 */

export type InkPart = {
  selector: string;
  keyframes: Keyframe[];
  duration: number;
  delay?: number;
  easing?: string;
  /** true when frame 0 hides the target (stroke draws): pre-posed while off screen. */
  hiddenStart?: boolean;
};

export const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

export const STROKE_DRAW: Keyframe[] = [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }];

function canAnimate() {
  if (typeof window === "undefined") return false;
  if (!("IntersectionObserver" in window) || typeof Element.prototype.animate !== "function") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (navigator.webdriver) return false;
  return true;
}

export function useInkEntrance<T extends Element>(parts: InkPart[], { load = false, delay = 0 } = {}) {
  const ref = useRef<T>(null);
  // Parts are static per render site; serialise once so the effect does not
  // re-run on every parent render.
  const key = JSON.stringify(parts.map((p) => [p.selector, p.duration, p.delay, p.hiddenStart]));

  useEffect(() => {
    const root = ref.current;
    if (!root || !canAnimate()) return;

    const targets = parts.flatMap((part) =>
      Array.from(root.querySelectorAll<HTMLElement | SVGElement>(part.selector)).map((el) => ({ el, part }))
    );
    if (targets.length === 0) return;

    const build = () =>
      targets.map(({ el, part }) => {
        if (part.hiddenStart) {
          // Paths carry pathLength="1": a dash of 1 is the whole stroke.
          el.style.strokeDasharray = "1";
        }
        const a = el.animate(part.keyframes, {
          duration: part.duration,
          delay: delay + (part.delay ?? 0),
          easing: part.easing ?? EASE_OUT_EXPO,
          fill: "backwards",
        });
        a.onfinish = a.oncancel = () => {
          if (part.hiddenStart) el.style.strokeDasharray = "";
        };
        return a;
      });

    if (load) {
      const anims = build();
      return () => anims.forEach((a) => a.cancel());
    }

    const r = root.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already visible: leave it finished

    // Off screen: pre-pose (paused at frame 0), play once it scrolls in.
    const anims = build();
    anims.forEach((a) => a.pause());
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          anims.forEach((a) => a.play());
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    io.observe(root);
    return () => {
      io.disconnect();
      anims.forEach((a) => a.cancel());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load, delay]);

  return ref;
}
