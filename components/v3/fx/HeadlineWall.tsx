"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Headline Wall (#1 in research/EFFECTS-CATALOGUE.md): the cards inside start
 * scattered around the middle of the screen, tilted and small, and settle into
 * their grid as the section scrolls in. Scrubbed, so scrolling back scatters
 * them again. Reduced motion: they are simply in place.
 */
const SCATTER = [
  { x: -38, y: -18, r: -12, s: 0.72 },
  { x: 34, y: -26, r: 10, s: 0.7 },
  { x: -30, y: 22, r: 8, s: 0.74 },
  { x: 36, y: 18, r: -9, s: 0.7 },
  { x: 0, y: -30, r: 4, s: 0.68 },
  { x: 0, y: 28, r: -5, s: 0.7 },
];

export function HeadlineWall({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const cards = [...el.querySelectorAll<HTMLElement>("[data-wall-card]")];
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const f = SCATTER[i % SCATTER.length];
        gsap.from(card, {
          xPercent: f.x * 2,
          yPercent: f.y * 2,
          rotate: f.r,
          scale: f.s,
          opacity: 0.4,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 95%", end: "top 25%", scrub: 0.6 },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
