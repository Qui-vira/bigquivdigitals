"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Viewfinder Frame (#34 in research/EFFECTS-CATALOGUE.md). Camera corner
 * brackets, a gold REC dot and a timecode around a video, so the section
 * reads as shot by a real person. The timecode follows the first <video>
 * inside it (its own currentTime, on requestAnimationFrame); with no video
 * playing it holds at 00:00:00:00. The REC dot is gold, never red.
 *
 * Reduced motion: static brackets, no ticking, no blinking.
 */
const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export function Viewfinder({ children, className = "", fps = 24 }: { children: ReactNode; className?: string; fps?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tc = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    function tick() {
      raf = 0;
      if (!visible) return;
      const v = el!.querySelector("video");
      const t = v ? v.currentTime : 0;
      if (tc.current) {
        const f = Math.floor((t % 1) * fps);
        tc.current.textContent = `${pad(t / 3600)}:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`;
      }
      raf = requestAnimationFrame(tick);
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [fps]);
  return (
    <div ref={ref} className={`v3-vf ${className}`}>
      {children}
      <span className="v3-vf__corner v3-vf__corner--tl" aria-hidden="true" />
      <span className="v3-vf__corner v3-vf__corner--tr" aria-hidden="true" />
      <span className="v3-vf__corner v3-vf__corner--bl" aria-hidden="true" />
      <span className="v3-vf__corner v3-vf__corner--br" aria-hidden="true" />
      <span className="v3-vf__rec" aria-hidden="true">
        <i />
        REC
      </span>
      <span className="v3-vf__tc" aria-hidden="true" ref={tc}>
        00:00:00:00
      </span>
    </div>
  );
}
