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

  // The number is the point of this site. It renders correctly by default and
  // the count-up is decoration layered on top. Two bugs have already shipped
  // here, both showing visitors "0+ COMMUNITY MEMBERS", so the invariant is:
  //
  //   whatever goes wrong, this component ends up displaying `target`.
  //
  // Three guards enforce that.
  const [count, setCount] = useState(target);

  // 1. A ref, not state, for the has-run flag. State would change the effect's
  //    dependencies, re-running it and firing the cleanup that cancels the
  //    animation frame mid-flight. That is the bug that shipped: the value
  //    dropped to 0, the rAF was cancelled by its own re-render, and nothing
  //    ever climbed back.
  const startedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion || !isInView || startedRef.current) return;
    startedRef.current = true;

    let frame = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    setCount(0);
    frame = requestAnimationFrame(step);

    // 2. A wall-clock backstop. requestAnimationFrame stalls in a background
    //    tab, and a stalled animation would otherwise leave 0 on screen.
    const failsafe = setTimeout(() => setCount(target), duration + 400);

    // 3. Cleanup restores the true value rather than abandoning whatever frame
    //    the animation happened to reach.
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(failsafe);
      setCount(target);
    };
    // startedRef is a ref on purpose: it must not appear here.
  }, [isInView, target, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
