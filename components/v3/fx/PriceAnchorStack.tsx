"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Price Anchor Stack (#25 in research/EFFECTS-CATALOGUE.md). The price cards
 * inside ([data-anchor-card], first to last) drop in from above with a small
 * tilt and stack; the last card is the offer and lands on top, square.
 * Scrubbed by scroll, so scrolling back lifts them off again.
 *
 * It carries no numbers of its own: the cards are whatever the page passes
 * (on TheEditCompanion, only the real prices). The finished stack is the
 * server markup; reduced motion shows it still.
 */
const TILT = [-4.5, 3.2, -2.4, 1.8];

export function PriceAnchorStack({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const cards = [...el.querySelectorAll<HTMLElement>("[data-anchor-card]")];
    if (!cards.length) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 92%", end: "top 58%", scrub: 0.6 },
      });
      cards.forEach((card, i) => {
        const last = i === cards.length - 1;
        tl.from(
          card,
          {
            yPercent: -38,
            y: -40,
            rotation: last ? -2 : TILT[i % TILT.length],
            opacity: 0,
            scale: 1.04,
            ease: "power3.out",
            duration: 1,
          },
          i * 0.7
        );
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
