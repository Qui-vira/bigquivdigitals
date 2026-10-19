"use client";

import { useEffect, useRef } from "react";

/**
 * The reading-progress bar for the article template: a gold rule under the
 * nav that fills as the article scrolls. One passive scroll listener writing
 * a transform on requestAnimationFrame. Decorative, so hidden from assistive
 * tech. Reduced motion: it still tracks (it is position, not animation), but
 * with no easing.
 */
export function ReadProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return <div ref={ref} className="v3-read-progress" aria-hidden="true" />;
}
