"use client";

import { cx } from "./cx";
import { useReveal } from "./useReveal";

/**
 * A gold highlighter pass behind live text. Follows the words across line
 * breaks. Sweeps in when scrolled into view; `load` sweeps on page load for
 * above-the-fold use.
 *
 *   Your next skill is going to end <Highlighter load>exactly like the last one did.</Highlighter>
 *
 * Use once or twice per page. Ink text on the gold mark stays above 8:1.
 */
export function Highlighter({
  children,
  load = false,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  load?: boolean;
  delay?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLSpanElement>();
  return (
    <span
      ref={load ? undefined : ref}
      className={cx("hl-mark", load && "hl-load", className)}
      style={{ "--rv-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
