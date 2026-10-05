"use client";

import { cx } from "./cx";
import { STROKE_DRAW, useInkEntrance } from "./useInkEntrance";

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
  // The circle hugs the GLYPHS, not the line box. It used to sit 0.26em above
  // the line box, and on a display heading set at leading 0.98 that is the
  // previous line's baseline: at 1440 the loop ran through "five invoices,"
  // above "nobody answering". Every value below is in em of the marked text,
  // so the loop scales with the type and tracks its words at every width.
  circle: {
    viewBox: "0 0 200 64",
    d: ["M30 9 C 78 1, 168 3, 190 21 C 204 38, 164 59, 100 60 C 38 61, 4 51, 7 33 C 10 17, 44 8, 92 6"],
    box: "left-[-0.32em] w-[calc(100%+0.64em)] top-[-0.05em] h-[calc(100%+0.14em)]",
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
 * a strike-through, drawn on when the words scroll into view. The words are
 * live text and never move; only the mark draws, and its resting state is the
 * finished mark (see useInkEntrance).
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
  const p = PATHS[kind];
  const ref = useInkEntrance<HTMLSpanElement>(
    p.d.map((_, i) => ({
      selector: `[data-ink="mark-${i}"]`,
      keyframes: STROKE_DRAW,
      duration: kind === "circle" ? 900 : 650,
      delay: i * 250,
      hiddenStart: true,
    })),
    { load, delay }
  );
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
            data-ink={`mark-${i}`}
          />
        ))}
      </svg>
    </span>
  );
}
