"use client";

import { cx } from "./cx";
import { useReveal } from "./useReveal";

type Kind = "underline" | "double-underline" | "circle" | "strike";

const PATHS: Record<Kind, { viewBox: string; d: string[]; box: string }> = {
  underline: {
    viewBox: "0 0 200 14",
    d: ["M3 9 C 48 3, 110 12, 197 5"],
    box: "left-[-2%] w-[104%] bottom-[-0.32em] h-[0.42em]",
  },
  "double-underline": {
    viewBox: "0 0 200 22",
    d: ["M3 7 C 52 2, 118 10, 197 4", "M10 17 C 64 12, 126 19, 192 13"],
    box: "left-[-2%] w-[104%] bottom-[-0.5em] h-[0.6em]",
  },
  circle: {
    viewBox: "0 0 200 64",
    d: ["M24 12 C 70 0, 170 2, 192 22 C 206 40, 160 60, 96 60 C 34 60, 2 50, 6 32 C 9 18, 40 9, 84 7"],
    box: "left-[-9%] w-[118%] top-[-0.26em] h-[calc(100%+0.52em)]",
  },
  strike: {
    viewBox: "0 0 200 12",
    d: ["M2 7 C 60 3, 130 10, 198 4"],
    box: "left-[-3%] w-[106%] top-[46%] h-[0.3em]",
  },
};

/**
 * (The svg gets an explicit width and height, never left+right / top+bottom:
 * an absolutely positioned <svg> is a replaced element and does not stretch
 * between insets, it falls back to its intrinsic 300x150.)
 *
 * Pen marks on live text: an underline, a double underline, a loose circle or
 * a strike-through, drawn on when the words scroll into view.
 *
 *   One system, one invoice, <HandMark kind="circle">one person</HandMark>.
 *
 * The marked phrase never wraps (a pen circle cannot follow a line break), so
 * keep it to a few words. The words stay real text; the mark is aria-hidden.
 */
export function HandMark({
  kind = "underline",
  tone = "gold",
  load = false,
  delay = 0,
  className,
  children,
}: {
  kind?: Kind;
  /** gold reads as a highlighter pen, ink as a biro. */
  tone?: "gold" | "ink";
  load?: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useReveal<HTMLSpanElement>();
  const p = PATHS[kind];
  const strokeCls = load ? "load-stroke" : "rv-stroke";
  return (
    <span ref={ref} className={cx("relative inline-block whitespace-nowrap", className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox={p.viewBox}
        preserveAspectRatio="none"
        className={cx("pointer-events-none absolute overflow-visible", p.box, tone === "gold" ? "text-gold" : "text-ink")}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {p.d.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            strokeWidth={kind === "circle" ? 3 : 4}
            className={strokeCls}
            style={{ "--stroke-delay": `${delay + i * 250}ms` } as React.CSSProperties}
          />
        ))}
      </svg>
    </span>
  );
}
