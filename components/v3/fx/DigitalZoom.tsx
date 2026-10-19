"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * #3 Digital Zoom (research/EFFECTS-CATALOGUE.md). The screenshot that proves
 * the claim pins, punches in on the one detail that proves it, holds, then
 * pulls back and lets go. The step is fast (power3.inOut), not a slow drift.
 * A gold ring marks the detail during the hold. Pin under 120vh.
 *
 * Reduced motion: no pin, no zoom; the cropped detail sits beside the full
 * image instead (CSS, `.v3-zoom__detail`).
 *
 * `x`, `y` are the detail's position as fractions of the image; `scale` is
 * the punch-in. The image must carry enough pixels for the zoomed state.
 */
export function DigitalZoom({
  x,
  y,
  scale = 2,
  src,
  children,
  className = "",
}: {
  x: number;
  y: number;
  scale?: number;
  src: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const inner = el.querySelector<HTMLElement>("[data-zoom-inner]");
      const ring = el.querySelector<HTMLElement>("[data-zoom-ring]");
      const pinTarget = (el.closest("figure") as HTMLElement | null) ?? el;
      if (!inner) return;
      gsap.set(inner, { transformOrigin: `${x * 100}% ${y * 100}%`, scale: 1 });
      gsap.set(ring, { autoAlpha: 0, scale: 0.6 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinTarget,
          start: () => (pinTarget.offsetHeight > window.innerHeight * 0.9 ? "top 8%" : "center center"),
          end: "+=100%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.to(inner, { scale, duration: 0.32, ease: "power3.inOut" })
        .to(ring, { autoAlpha: 1, scale: 1, duration: 0.08, ease: "back.out(2)" }, 0.26)
        .to({}, { duration: 0.3 })
        .to(ring, { autoAlpha: 0, duration: 0.06 })
        .to(inner, { scale: 1, duration: 0.32, ease: "power3.inOut" }, "<");
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(inner, { clearProps: "transform" });
      };
    });
    return () => mm.revert();
  }, [x, y, scale]);

  return (
    <div ref={ref} className={`v3-zoom ${className}`}>
      <div className="v3-zoom__frame">
        <div className="v3-zoom__inner" data-zoom-inner>
          {children}
        </div>
        {/* the zoom's origin is the detail, so the detail never moves: the ring can sit on the frame */}
        <span className="v3-zoom__ring" data-zoom-ring aria-hidden="true" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />
      </div>
      <div
        className="v3-zoom__detail"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${scale * 100}% auto`,
          backgroundPosition: `${x * 100}% ${y * 100}%`,
        }}
      />
    </div>
  );
}
