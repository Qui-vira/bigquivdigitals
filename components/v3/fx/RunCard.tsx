"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Run Card (#29 in research/EFFECTS-CATALOGUE.md). A card that runs a real
 * pipeline once as it enters view: each [data-run-step] waits, spins, then
 * ticks, and the bar along the top ([data-run-bar]) fills as it goes. Played
 * once on enter, not scrubbed.
 *
 * The finished card is what the server renders (every step ticked, bar full),
 * so without JavaScript or with reduced motion the visitor sees the completed
 * run. On mount the card is reset to "waiting", which only happens below the
 * fold, before it is seen.
 */
export function RunCard({ children, className = "", stepTime = 0.62 }: { children: ReactNode; className?: string; stepTime?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const steps = [...el.querySelectorAll<HTMLElement>("[data-run-step]")];
    const bar = el.querySelector<HTMLElement>("[data-run-bar]");
    const r = el.getBoundingClientRect();
    // already on screen (a deep link, a reload half way down): leave it finished
    if (r.top < window.innerHeight * 0.85) return;
    steps.forEach((s) => (s.dataset.state = "wait"));
    if (bar) gsap.set(bar, { scaleX: 0 });
    el.dataset.running = "wait";
    const tl = gsap.timeline({ paused: true, onComplete: () => (el.dataset.running = "done") });
    steps.forEach((s, i) => {
      tl.call(() => (s.dataset.state = "run"), undefined, i * stepTime);
      tl.call(() => (s.dataset.state = "done"), undefined, i * stepTime + stepTime * 0.8);
    });
    if (bar) tl.to(bar, { scaleX: 1, duration: steps.length * stepTime, ease: "none" }, 0);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 72%",
      once: true,
      onEnter: () => {
        el.dataset.running = "run";
        tl.play(0);
      },
    });
    return () => {
      st.kill();
      tl.kill();
      steps.forEach((s) => (s.dataset.state = "done"));
      if (bar) gsap.set(bar, { clearProps: "transform" });
    };
  }, [stepTime]);
  return (
    <div ref={ref} className={className} data-running="done">
      {children}
    </div>
  );
}
