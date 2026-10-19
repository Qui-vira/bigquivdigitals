"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Viewfinder Frame (#34 in research/EFFECTS-CATALOGUE.md): camera corner
 * brackets, a REC dot (gold, never red) and a timecode around the showreel.
 * The timecode reads the film's own clock: it stands at zero on the poster
 * and runs with the video once it plays. Reduced motion: the brackets stay,
 * the dot does not blink.
 */
const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export function Viewfinder({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tc = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = "";
    const tick = () => {
      const v = el.querySelector("video");
      const t = v ? v.currentTime : 0;
      const frames = Math.floor((t % 1) * 24);
      const text = `${pad(t / 3600)}:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad(frames)}`;
      if (text !== last && tc.current) {
        tc.current.textContent = text;
        last = text;
      }
      el.classList.toggle("is-rolling", !!v && !v.paused);
      raf = requestAnimationFrame(tick);
    };
    // only run the clock while the frame is on screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={`v3-vf ${className}`}>
      <span className="v3-vf__c v3-vf__c--tl" aria-hidden="true" />
      <span className="v3-vf__c v3-vf__c--tr" aria-hidden="true" />
      <span className="v3-vf__c v3-vf__c--bl" aria-hidden="true" />
      <span className="v3-vf__c v3-vf__c--br" aria-hidden="true" />
      <p className="v3-vf__hud" aria-hidden="true">
        <span className="v3-vf__rec">
          <i />
          REC
        </span>
        <span ref={tc} className="v3-vf__tc">
          00:00:00:00
        </span>
      </p>
      {children}
    </div>
  );
}
