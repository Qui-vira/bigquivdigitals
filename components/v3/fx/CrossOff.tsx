"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

/**
 * Objection Cross-Off (#27 in research/EFFECTS-CATALOGUE.md): what the reader
 * thinks they need gets crossed out, the one real requirement gets a tick.
 * Runs once as the card reaches the middle of the screen: each X draws in and
 * its words are struck, then the tick draws. Reduced motion: the final state.
 *
 * Every item is a phrase from the page's own copy, passed in by the page. The
 * card repeats what the paragraphs beside it already say, so it is hidden from
 * screen readers to avoid reading it twice.
 */
export function CrossOff({ items, className = "" }: { items: { text: string; ok?: boolean }[]; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>("li")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rows.forEach((r) => r.classList.add("is-done"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const timers: number[] = [];
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 62%",
      once: true,
      onEnter: () => rows.forEach((r, i) => timers.push(window.setTimeout(() => r.classList.add("is-done"), 200 + i * 520))),
    });
    return () => {
      st.kill();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return (
    <ul ref={ref} className={`v3-cross ${className}`} aria-hidden="true">
      {items.map((it) => (
        <li key={it.text} className={it.ok ? "is-ok" : "is-no"}>
          <svg viewBox="0 0 24 24" fill="none">
            {it.ok ? (
              <path pathLength={1} d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
            ) : (
              <path pathLength={1} d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
            )}
          </svg>
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}
