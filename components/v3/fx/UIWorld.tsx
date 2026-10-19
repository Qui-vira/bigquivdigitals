"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * UI World (#9 in research/EFFECTS-CATALOGUE.md): the system's real screens
 * float in 3D space at different depths, settle into one cluster as you
 * scroll, then the lead screen comes forward and flattens to full size so the
 * last state carries the reading.
 *
 * The HTML default is a flat grid of the same screenshots, which is what
 * phones, reduced motion and no-JS get. Only wide screens with motion build
 * the 3D world, inside gsap.matchMedia, so a resize or a preference change
 * reverts cleanly.
 */
export type UIWorldScreen = { src: string; alt: string; w: number; h: number };

// cluster positions (percent of the stage, px of depth, degrees)
const CLUSTER = [
  { x: 0, y: 0, z: 0, ry: -8, rx: 4 },
  { x: -33, y: -20, z: -260, ry: 16, rx: 6 },
  { x: 34, y: -24, z: -180, ry: -18, rx: 5 },
  { x: 30, y: 28, z: -320, ry: -14, rx: -4 },
];
const FAR = [
  { x: -70, y: 60, z: -1600, ry: 40, rx: 20 },
  { x: -90, y: -70, z: -1800, ry: 50, rx: 10 },
  { x: 90, y: -60, z: -1700, ry: -50, rx: 15 },
  { x: 80, y: 80, z: -1900, ry: -40, rx: -10 },
];

export function UIWorld({ screens, className }: { screens: UIWorldScreen[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      el.classList.add("is-3d");
      const world = el.querySelector<HTMLElement>(".v3-uiworld__world")!;
      const wins = [...el.querySelectorAll<HTMLElement>(".v3-uiworld__win")];
      const at = (i: number, set: typeof CLUSTER) => set[i % set.length];
      wins.forEach((w, i) => {
        const f = at(i, FAR);
        gsap.set(w, { xPercent: -50 + f.x, yPercent: -50 + f.y, z: f.z, rotateY: f.ry, rotateX: f.rx, opacity: 0 });
      });
      gsap.set(world, { rotateX: 20, rotateY: -14 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "+=170%", pin: true, scrub: 0.8, invalidateOnRefresh: true },
      });
      wins.forEach((w, i) => {
        const c = at(i, CLUSTER);
        tl.to(w, { xPercent: -50 + c.x, yPercent: -50 + c.y, z: c.z, rotateY: c.ry, rotateX: c.rx, opacity: 1, duration: 0.42, ease: "power2.out" }, i * 0.06);
      });
      tl.to(world, { rotateX: 6, rotateY: 0, duration: 0.5 }, 0);
      // hold, then the lead screen comes forward and flattens; the rest fall back
      tl.to(world, { rotateX: 0, duration: 0.3 }, 0.62);
      tl.to(wins[0], { xPercent: -50, yPercent: -50, z: 120, rotateY: 0, rotateX: 0, scale: 1.32, duration: 0.34, ease: "power2.inOut" }, 0.62);
      wins.slice(1).forEach((w, i) => {
        const c = at(i + 1, CLUSTER);
        tl.to(w, { z: c.z - 500, opacity: 0.18, duration: 0.34, ease: "power2.inOut" }, 0.62);
      });
      return () => el.classList.remove("is-3d");
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={`v3-uiworld${className ? ` ${className}` : ""}`}>
      <div className="v3-uiworld__world">
        {screens.map((s, i) => (
          <figure key={s.src} className="v3-uiworld__win" style={{ ["--ar" as string]: `${s.w} / ${s.h}` }} data-lead={i === 0 || undefined}>
            <span className="v3-uiworld__bar" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" />
          </figure>
        ))}
      </div>
    </div>
  );
}
