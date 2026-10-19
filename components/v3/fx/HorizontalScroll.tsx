"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Horizontal pinned scroll (#38 in research/EFFECTS-CATALOGUE.md): the section
 * pins and vertical scroll moves its panels sideways, with a thin gold
 * progress line. Every panel is in the DOM in reading order, so Tab and screen
 * readers walk it normally; focusing a panel scrolls the page to it.
 *
 * Phones, reduced motion and no-JS get the panels as a plain wrapped grid
 * (the HTML default). `enabled={false}` tears the pin down cleanly, which the
 * Work page needs when a filter tab hides the films.
 */
export function HorizontalScroll({
  head,
  children,
  enabled = true,
  className,
  label,
}: {
  head?: ReactNode;
  children: ReactNode;
  enabled?: boolean;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      root.classList.add("is-h");
      const track = root.querySelector<HTMLElement>(".v3-hs__track")!;
      const bar = root.querySelector<HTMLElement>(".v3-hs__bar");
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          },
        },
      });
      // keyboard: a focused panel brings its place in the scroll into view
      const onFocus = (e: FocusEvent) => {
        const st = tween.scrollTrigger;
        const panel = (e.target as HTMLElement).closest<HTMLElement>(".v3-hs__track > *");
        if (!st || !panel) return;
        const d = distance();
        if (!d) return;
        const ratio = Math.min(1, Math.max(0, (panel.offsetLeft - 32) / d));
        const y = st.start + (st.end - st.start) * ratio;
        const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo({ top: y });
      };
      root.addEventListener("focusin", onFocus);
      return () => {
        root.removeEventListener("focusin", onFocus);
        root.classList.remove("is-h");
      };
    });
    const r = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      window.cancelAnimationFrame(r);
      mm.revert();
    };
  }, [enabled]);

  return (
    <div ref={ref} className={`v3-hs${className ? ` ${className}` : ""}`} role="region" aria-label={label}>
      {head}
      <div className="v3-hs__track">{children}</div>
      <div className="v3-hs__line" aria-hidden="true">
        <i className="v3-hs__bar" />
      </div>
    </div>
  );
}
