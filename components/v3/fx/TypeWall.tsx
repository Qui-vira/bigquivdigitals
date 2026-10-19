"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Type Wall (#15 in research/EFFECTS-CATALOGUE.md): the seven module titles
 * set as a wall of very large words. Each row slides against its neighbour as
 * the wall passes (scrubbed, so scrolling back plays it back), and the wall
 * narrows to the week you are reading: the row in the middle of the screen is
 * full strength, the rest drop back to a ghost. Every word is real list
 * content, so screen readers read the list as a list.
 *
 * Rows are the `[data-wall-row]` children; each row's `[data-wall-word]` is
 * the part that slides. Reduced motion or no script: every row full strength,
 * nothing moves.
 */
export function TypeWall({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    el.classList.add("is-wall");
    const rows = [...el.querySelectorAll<HTMLElement>("[data-wall-row]")];
    // a narrow screen has no room for the words to travel past its edges
    const amp = window.innerWidth < 760 ? 0.35 : 1;
    const ctx = gsap.context(() => {
      rows.forEach((row, i) => {
        const word = row.querySelector<HTMLElement>("[data-wall-word]");
        const dir = i % 2 === 0 ? 1 : -1;
        if (word)
          gsap.fromTo(
            word,
            { xPercent: dir * 7 * amp },
            { xPercent: -dir * 3 * amp, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.6 } }
          );
        ScrollTrigger.create({
          trigger: row,
          start: "top 58%",
          end: "bottom 42%",
          toggleClass: { targets: row, className: "is-on" },
        });
      });
    }, el);
    return () => {
      ctx.revert();
      el.classList.remove("is-wall");
    };
  }, []);
  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
