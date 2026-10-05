"use client";

import { cx, display, positioned } from "./cx";
import { STROKE_DRAW, useInkEntrance, type InkPart } from "./useInkEntrance";

type Pt = [number, number];
type Curve = { p0: Pt; c1: Pt; c2: Pt; p3: Pt; box: [number, number] };

/**
 * Arrow curves, each a single cubic in its own box, drawn the way a pen would:
 * a little overshoot, never a straight line. The arrowhead is derived from the
 * curve's end tangent so it always points along the stroke.
 */
const ARROWS: Record<ArrowKind, Curve> = {
  "down-left": { p0: [104, 6], c1: [100, 40], c2: [62, 60], p3: [14, 62], box: [120, 76] },
  "down-right": { p0: [16, 6], c1: [20, 40], c2: [58, 60], p3: [106, 62], box: [120, 76] },
  "up-left": { p0: [104, 70], c1: [100, 34], c2: [62, 16], p3: [14, 14], box: [120, 76] },
  "up-right": { p0: [16, 70], c1: [20, 34], c2: [58, 16], p3: [106, 14], box: [120, 76] },
  down: { p0: [30, 4], c1: [52, 28], c2: [12, 52], p3: [32, 84], box: [64, 92] },
  up: { p0: [30, 88], c1: [52, 62], c2: [12, 38], p3: [32, 8], box: [64, 92] },
  left: { p0: [112, 30], c1: [84, 10], c2: [44, 50], p3: [8, 28], box: [120, 60] },
  right: { p0: [8, 30], c1: [36, 10], c2: [76, 50], p3: [112, 28], box: [120, 60] },
};

export type ArrowKind =
  | "down-left"
  | "down-right"
  | "up-left"
  | "up-right"
  | "down"
  | "up"
  | "left"
  | "right";

function arrowPaths({ p0, c1, c2, p3 }: Curve) {
  const body = `M${p0[0]} ${p0[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p3[0]} ${p3[1]}`;
  const dx = p3[0] - c2[0];
  const dy = p3[1] - c2[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = (angle: number) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const bx = -(ux * c - uy * s) * 15;
    const by = -(ux * s + uy * c) * 15;
    return `${(p3[0] + bx).toFixed(1)} ${(p3[1] + by).toFixed(1)}`;
  };
  return { body, head: `M${head(0.5)} L${p3[0]} ${p3[1]} L${head(-0.5)}` };
}

/** The arrow draws body first, then the head, like a pen would. */
function arrowParts(delay: number): InkPart[] {
  return [
    { selector: '[data-ink="arrow-body"]', keyframes: STROKE_DRAW, duration: 620, delay, hiddenStart: true },
    { selector: '[data-ink="arrow-head"]', keyframes: STROKE_DRAW, duration: 260, delay: delay + 480, hiddenStart: true },
  ];
}

/**
 * The words of a note never hide. They arrive from a visible pose, a small
 * lift and over-tilt that settles, like ink landing on the page; the strokes
 * of the arrow are the only thing that draws on.
 */
const WORDS_SETTLE: Keyframe[] = [
  { transform: "translate3d(-0.08em, 0.16em, 0) rotate(-2.5deg) scale(0.95)", filter: "blur(1.2px)" },
  { transform: "none", filter: "blur(0)" },
];

/** A pen-drawn arrow on its own. Size it with className (width; height follows). */
export function HandArrow({
  kind = "down-left",
  className,
  strokeDelay = 0,
  load = false,
  tone = "ink",
  selfDraw = true,
}: {
  kind?: ArrowKind;
  className?: string;
  /** Extra delay before the stroke draws, in ms. */
  strokeDelay?: number;
  /** Draw on page load instead of on scroll (above-the-fold use). */
  load?: boolean;
  tone?: "ink" | "gold-deep";
  /** false when a parent (HandNote) runs the entrance for it. */
  selfDraw?: boolean;
}) {
  const curve = ARROWS[kind];
  const { body, head } = arrowPaths(curve);
  // Standalone use only: inside a HandNote the note's own entrance draws it.
  const ref = useInkEntrance<SVGSVGElement>(selfDraw ? arrowParts(strokeDelay) : [], { load });
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox={`0 0 ${curve.box[0]} ${curve.box[1]}`}
      className={cx("block h-auto overflow-visible", tone === "ink" ? "text-ink" : "text-gold-deep", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={body} pathLength={1} data-ink="arrow-body" />
      <path d={head} pathLength={1} data-ink="arrow-head" />
    </svg>
  );
}

/**
 * A margin note in marker pen, the way a designer annotates a printout.
 * The words settle onto the page, then the arrow draws. The words are never
 * clipped or hidden at any frame (see useInkEntrance for why).
 *
 *   <HandNote arrow="down-left" arrowAt="end">move your cursor over my face</HandNote>
 *
 * Handwriting carries ASIDES: pointers, nudges, labels. Never body copy and
 * never a claim. Keep notes under about six words.
 *
 * `load` plays on page load (use above the fold, where scroll reveals do not
 * arm). Otherwise it plays when scrolled into view.
 */
export function HandNote({
  children,
  arrow,
  arrowAt = "end",
  arrowClassName,
  tilt = -3,
  size = "md",
  tone = "ink",
  load = false,
  delay = 0,
  as: Tag = "span",
  className,
}: {
  children: React.ReactNode;
  arrow?: ArrowKind;
  /** Where the arrow sits relative to the words. */
  arrowAt?: "start" | "end" | "below" | "above";
  arrowClassName?: string;
  tilt?: number;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "gold-deep";
  load?: boolean;
  delay?: number;
  as?: "span" | "div" | "p";
  className?: string;
}) {
  const ref = useInkEntrance<HTMLElement>(
    [
      { selector: '[data-ink="words"]', keyframes: WORDS_SETTLE, duration: 700 },
      ...arrowParts(260),
    ],
    { load, delay }
  );
  const sizeCls =
    size === "lg"
      ? "text-[2.2rem] sm:text-[2.6rem]"
      : size === "sm"
        ? "text-[1.45rem] sm:text-[1.55rem]"
        : "text-[1.75rem] sm:text-[2.05rem]";
  const toneCls = tone === "ink" ? "text-ink" : "text-gold-deep";
  const words = (
    <span data-ink="words" className="inline-block whitespace-nowrap">
      {children}
    </span>
  );
  const arrowEl = arrow ? (
    <HandArrow
      kind={arrow}
      tone={tone}
      selfDraw={false}
      className={cx("w-[84px] shrink-0 sm:w-[100px]", arrowClassName)}
    />
  ) : null;
  const vertical = arrowAt === "below" || arrowAt === "above";

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cx(
        positioned(className),
        display(className, "inline-flex"),
        "pointer-events-none font-hand font-bold leading-none",
        vertical ? "flex-col items-start gap-1" : "items-center gap-2",
        sizeCls,
        toneCls,
        className
      )}
      style={{ rotate: `${tilt}deg` }}
    >
      {(arrowAt === "start" || arrowAt === "above") && arrowEl}
      {words}
      {(arrowAt === "end" || arrowAt === "below") && arrowEl}
    </Tag>
  );
}
