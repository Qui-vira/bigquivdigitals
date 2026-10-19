"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type FreezePin = {
  /** the detail, as fractions of the image */
  x: number;
  y: number;
  /** where the label sits, as fractions of the image */
  px: number;
  py: number;
  /** words lifted from the case study; never new copy */
  text: string;
};

/**
 * #6 Freeze and Label (research/EFFECTS-CATALOGUE.md). As the screenshot
 * reaches the middle of the screen it holds and dims a little, and one or two
 * labels draw in: a gold dot on the exact detail, a thin leader line, a paper
 * pill. Scrolling on, the labels retract. At most two labels per frame, 14px
 * minimum. Reduced motion: the labels are simply there.
 */
export function FreezeLabel({ pins, w, h, children }: { pins: FreezePin[]; w: number; h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-frozen");
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 62%",
      end: "bottom 22%",
      toggleClass: { targets: el, className: "is-frozen" },
    });
    return () => st.kill();
  }, []);

  return (
    <div ref={ref} className="v3-freeze">
      {children}
      <svg className="v3-freeze__lines" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        {pins.slice(0, 2).map((p, i) => (
          <line
            key={i}
            x1={p.x * w}
            y1={p.y * h}
            x2={p.px * w}
            y2={p.py * h}
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            style={{ transitionDelay: `${i * 140}ms` }}
          />
        ))}
      </svg>
      {pins.slice(0, 2).map((p, i) => (
        <span key={i} className="v3-freeze__dot" aria-hidden="true" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transitionDelay: `${i * 140}ms` }} />
      ))}
      {pins.slice(0, 2).map((p, i) => (
        <span
          key={i}
          className="v3-freeze__pill"
          aria-hidden="true"
          style={{ left: `${p.px * 100}%`, top: `${p.py * 100}%`, transitionDelay: `${160 + i * 140}ms` }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}
