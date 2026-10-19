"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Before and After (#7 in research/EFFECTS-CATALOGUE.md). Two layers in one
 * frame; the "after" layer is clipped at the divider. When the slider first
 * scrolls into view the divider sweeps once on its own (right to left, then
 * back to the middle); after that the visitor drags it, clicks anywhere on
 * the frame, or uses the arrow keys on the handle (role="slider").
 *
 * Both layers are passed in as children, so a real raw take and a real
 * finished video drop in without touching this file. Reduced motion: no
 * sweep, the handle still works.
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  label,
  className = "",
}: {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  /** accessible name of the slider */
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const dragging = useRef(false);
  const tween = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);

  const setFromX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSplit(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const o = { v: 50 };
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      once: true,
      onEnter: () => {
        if (dragging.current) return;
        tween.current = gsap
          .timeline({ onUpdate: () => setSplit(o.v) })
          .to(o, { v: 88, duration: 0.6, ease: "power2.out" })
          .to(o, { v: 12, duration: 1.3, ease: "power2.inOut" })
          .to(o, { v: 50, duration: 0.9, ease: "expo.out" });
      },
    });
    return () => {
      st.kill();
      tween.current?.kill();
    };
  }, []);

  const stopSweep = () => {
    tween.current?.kill();
    tween.current = null;
  };

  return (
    <div
      ref={ref}
      className={`v3-ba ${className}`}
      style={{ ["--split" as string]: `${split}%` }}
      onPointerDown={(e) => {
        stopSweep();
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setFromX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) setFromX(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <div className="v3-ba__layer v3-ba__before">{before}</div>
      <div className="v3-ba__layer v3-ba__after">{after}</div>
      <span className="v3-ba__pill v3-ba__pill--before">{beforeLabel}</span>
      <span className="v3-ba__pill v3-ba__pill--after">{afterLabel}</span>
      <div className="v3-ba__divider" aria-hidden="true" />
      <button
        type="button"
        className="v3-ba__handle"
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
        aria-valuetext={`${Math.round(split)}% ${beforeLabel.toLowerCase()}`}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 4;
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") setSplit((v) => Math.max(0, v - step));
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") setSplit((v) => Math.min(100, v + step));
          else if (e.key === "Home") setSplit(0);
          else if (e.key === "End") setSplit(100);
          else return;
          e.preventDefault();
          stopSweep();
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7 4 12l5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </button>
    </div>
  );
}
