"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
  className = "",
}: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduceMotion = useReducedMotion();

  // Start at the real number, not at zero.
  //
  // This previously initialised to 0 and only reached `target` once
  // IntersectionObserver fired. Anything that stopped the observer firing left
  // a real visitor looking at "0+ COMMUNITY MEMBERS": blocked JavaScript, a
  // hydration error, a tab that never composited, a full-page screenshot. On a
  // site whose whole argument is that the numbers are real, rendering zero is
  // the worst available failure mode.
  //
  // Now the correct value is what renders by default. The count-up is
  // progressive enhancement on top: if the animation never runs, the number is
  // still right.
  const [count, setCount] = useState(target);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    if (!isInView || hasAnimated) return;

    setHasAnimated(true);
    let frame = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        // Never leave a rounding artefact on screen.
        setCount(target);
      }
    };

    // Drop to zero only at the moment we know we can animate back up.
    setCount(0);
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [isInView, target, duration, reduceMotion, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
