"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scan Card (#32 in research/EFFECTS-CATALOGUE.md): a card resolves behind a
 * thin gold line that sweeps left to right as it scrolls in, like a scanner
 * reading it. A plain 2px stroke locked to the clip edge: no glow, no trail.
 * The HTML default is the resolved card (reduced motion and no-JS).
 */
export function ScanCard({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const body = el.querySelector<HTMLElement>(".v3-scan__body");
      const line = el.querySelector<HTMLElement>(".v3-scan__line");
      if (!body || !line) return;
      const state = { p: 0 };
      const paint = () => {
        body.style.clipPath = `inset(0 ${(100 - state.p).toFixed(2)}% 0 0)`;
        line.style.left = `${state.p}%`;
        line.style.opacity = state.p > 0 && state.p < 100 ? "1" : "0";
      };
      paint();
      gsap.to(state, {
        p: 100,
        duration: 1.1,
        delay,
        ease: "power2.inOut",
        onUpdate: paint,
        onComplete: () => {
          body.style.clipPath = "";
          line.style.opacity = "0";
        },
        scrollTrigger: { trigger: el, start: "top 82%", once: true },
      });
      return () => {
        body.style.clipPath = "";
        line.style.opacity = "0";
      };
    });
    return () => mm.revert();
  }, [delay]);

  return (
    <div ref={ref} className={`v3-scan${className ? ` ${className}` : ""}`}>
      <div className="v3-scan__body">{children}</div>
      <span className="v3-scan__line" aria-hidden="true" />
    </div>
  );
}
