"use client";

import { useEffect, useRef } from "react";
import { BeforeAfter } from "@/components/v3/fx/BeforeAfter";
import { clip, poster } from "@/lib/ugc-challenge";

/**
 * A raw take under its finished reel in a 9:16 Before and After slider (#7),
 * the same seconds on both sides (lib/ugc-challenge.ts BEFORE_AFTER).
 *
 * Both videos load only when the slider nears the viewport, play muted while
 * it is on screen and pause when it leaves; the reel follows the raw take so
 * the two never drift. Reduced motion: the two posters, nothing plays.
 */
export function ReelBeforeAfter({
  before,
  after,
  label,
  beforeLabel = "Raw take",
  afterLabel = "The reel",
  className = "",
}: {
  /** clip names, without extension */
  before: string;
  after: string;
  label: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [a, b] = Array.from(el.querySelectorAll<HTMLVideoElement>("video"));
    if (!a || !b) return;
    const io = new IntersectionObserver(
      ([e]) => {
        [a, b].forEach((v) => {
          if (e.isIntersecting) {
            if (!v.src && v.dataset.src) v.src = v.dataset.src;
            v.play().catch(() => {});
          } else v.pause();
        });
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    const sync = window.setInterval(() => {
      if (!a.paused && Math.abs(a.currentTime - b.currentTime) > 0.08) b.currentTime = a.currentTime;
    }, 500);
    return () => {
      io.disconnect();
      window.clearInterval(sync);
    };
  }, []);

  return (
    <div ref={ref}>
      <BeforeAfter
        className={`v3-ba--reel ${className}`}
        label={label}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        before={<video data-src={clip(before)} poster={poster(before)} muted loop playsInline preload="none" />}
        after={<video data-src={clip(after)} poster={poster(after)} muted loop playsInline preload="none" />}
      />
    </div>
  );
}
