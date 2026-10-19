"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Spotlight (#4 in research/EFFECTS-CATALOGUE.md), the lights-out version for
 * a reading section: as the section's one line reaches the middle of the
 * screen, the paper ground goes to navy (never black), the words around it
 * step back, and a soft pool of a lighter navy sits behind the line. The words
 * of the line then light up one after another. Scrolling past brings the
 * lights back. A 400 ms colour change, a soft mask edge, no glow.
 *
 * The section's markup sets the lit look in CSS under `.is-out`; this only
 * toggles the class and staggers `[data-light]` words. Reduced motion: the
 * section is just paper with every word visible, nothing switches.
 */
export function LightsOut({
  children,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const words = [...el.querySelectorAll<HTMLElement>("[data-light]")];
    const st = ScrollTrigger.create({
      trigger: el.querySelector("[data-light-line]") || el,
      start: "top 62%",
      end: "bottom 30%",
      onToggle: ({ isActive }) => {
        el.classList.toggle("is-out", isActive);
        words.forEach((w, i) => {
          window.clearTimeout(Number(w.dataset.t || 0));
          if (isActive) w.dataset.t = String(window.setTimeout(() => w.classList.add("is-lit"), 260 + i * 140));
          else w.classList.remove("is-lit");
        });
      },
    });
    return () => {
      st.kill();
      el.classList.remove("is-out");
      words.forEach((w) => window.clearTimeout(Number(w.dataset.t || 0)));
    };
  }, []);
  return (
    <section ref={ref} className={`v3-lights ${className}`} data-nav="cloud" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}
