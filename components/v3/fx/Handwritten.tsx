"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Handwritten Annotation (#28 in research/EFFECTS-CATALOGUE.md): one note in
 * Caveat with a drawn arrow. As it scrolls in, the arrow draws on stroke by
 * stroke and the words write themselves left to right (a clip-path wipe).
 * The page's one Caveat line. Decorative: aria-hidden, and the HTML default is
 * the finished note (reduced motion and no-JS).
 *
 * `arrow` is an SVG path in a 120 x 60 box, drawn from its first point.
 */
export function Handwritten({ text, arrow, className }: { text: string; arrow: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const words = el.querySelector<HTMLElement>(".v3-hw__text");
      const paths = [...el.querySelectorAll<SVGPathElement>("path")];
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      tl.fromTo(words, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.inOut" });
      tl.to(paths, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out", stagger: 0.12 }, "-=0.15");
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={`v3-hw${className ? ` ${className}` : ""}`} aria-hidden="true">
      <span className="v3-hw__text v3-hand">{text}</span>
      <svg className="v3-hw__arrow" viewBox="0 0 120 60" fill="none">
        {arrow.split("|").map((d) => (
          <path key={d} d={d} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  );
}
