"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/**
 * Keyword slam (#22 in research/EFFECTS-CATALOGUE.md): the one slam phrase on
 * the page comes in large and blurred and settles into its line, once, as the
 * page opens. It animates its own wrapper, never the words inside it, so the
 * stage's word-by-word lift on scroll keeps working on the same heading.
 * Reduced motion: the phrase is simply there.
 */
export function KeywordSlam({ children, delay = 0.35 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tw = gsap.fromTo(
      el,
      { scale: 1.32, opacity: 0, filter: "blur(10px)", transformOrigin: "0% 60%" },
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.9, delay, ease: "expo.out", clearProps: "filter,transform" }
    );
    return () => {
      tw.kill();
      gsap.set(el, { clearProps: "all" });
    };
  }, [delay]);
  return (
    <span ref={ref} className="v3-slam">
      {children}
    </span>
  );
}
