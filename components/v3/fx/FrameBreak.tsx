"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Frame Break (#14 in research/EFFECTS-CATALOGUE.md): his cut-out sits inside
 * a card frame; as the section scrolls in, the frame settles back a little
 * while he stays full size and steps out over the frame's top edge.
 *
 * Two layers: the frame (clipped, behind) and the cut-out (unclipped, above).
 * The cut-out starts clipped to the frame's top edge and the clip opens as the
 * scroll scrubs, so his head and shoulders break out of the card. The HTML
 * default is the broken-out final state (reduced motion and no-JS).
 */
export function FrameBreak({
  src,
  alt,
  width,
  height,
  caption,
  children,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const frame = el.querySelector<HTMLElement>(".v3-fb__frame");
      const cut = el.querySelector<HTMLElement>(".v3-fb__cut");
      if (!frame || !cut) return;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top 85%", end: "top 25%", scrub: 0.6 },
      });
      tl.fromTo(frame, { scale: 1.04, yPercent: -2 }, { scale: 0.94, yPercent: 3 }, 0);
      tl.fromTo(cut, { scale: 0.92, yPercent: 8, "--clip": "40%" }, { scale: 1.04, yPercent: 0, "--clip": "0%" }, 0);
    });
    return () => mm.revert();
  }, []);

  return (
    <figure ref={ref} className="v3-fb">
      <div className="v3-fb__frame" aria-hidden="true" />
      <div className="v3-fb__cut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      </div>
      {caption && <figcaption className="v3-fb__cap">{caption}</figcaption>}
      {children}
    </figure>
  );
}
