"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextRevealProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  mode?: "words" | "chars";
  staggerDelay?: number;
  once?: boolean;
}

export function TextReveal({
  children,
  className = "",
  as: Tag = "h2",
  mode = "words",
  staggerDelay = 0.03,
  once = true,
}: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-10% 0px" });

  const units = mode === "words" ? children.split(" ") : children.split("");

  return (
    // No overflow-hidden. It was there to clip words sliding up from below,
    // which is the same failure mode as opacity 0: if the observer never fires,
    // the clip hides the heading permanently — exactly what left ~2,950px of
    // the homepage blank on 2026-07-25. The entrance is now a small lift from a
    // fully visible position, so the worst case is a heading sitting 14px low.
    <Tag ref={ref} className={className}>
      {units.map((unit, i) => (
        <motion.span
          key={i}
          className="inline-block"
          // Was initial y:"0%" animating to y:0 — the same value — so this
          // component rendered every heading on /about, /contact and the CTA
          // banner with no motion whatsoever. It went inert during the
          // blank-page fix, which removed the danger and the animation
          // together, and nobody noticed because the failure looks exactly
          // like static text.
          initial={{ opacity: 1, y: 14 }}
          animate={isInView ? { y: 0 } : undefined}
          transition={{
            duration: 0.55,
            delay: i * staggerDelay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {unit}
          {mode === "words" && i < units.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Tag>
  );
}
