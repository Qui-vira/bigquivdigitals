"use client";

import { cx, display, positioned } from "./cx";
import { useReveal } from "./useReveal";

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

/** A pen-drawn arrow on its own. Size it with className (width; height follows). */
export function HandArrow({
  kind = "down-left",
  className,
  strokeDelay = 0,
  load = false,
  tone = "ink",
}: {
  kind?: ArrowKind;
  className?: string;
  /** Extra delay before the stroke draws, in ms. */
  strokeDelay?: number;
  /** Draw on page load instead of on scroll (above-the-fold use). */
  load?: boolean;
  tone?: "ink" | "gold-deep";
}) {
  const curve = ARROWS[kind];
  const { body, head } = arrowPaths(curve);
  const strokeCls = load ? "load-stroke" : "rv-stroke";
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${curve.box[0]} ${curve.box[1]}`}
      className={cx("block h-auto overflow-visible", tone === "ink" ? "text-ink" : "text-gold-deep", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={body}
        pathLength={1}
        className={strokeCls}
        style={{ "--stroke-delay": `${strokeDelay}ms` } as React.CSSProperties}
      />
      <path
        d={head}
        pathLength={1}
        className={strokeCls}
        style={{ "--stroke-delay": `${strokeDelay + 450}ms` } as React.CSSProperties}
      />
    </svg>
  );
}

/**
 * A margin note in marker pen, the way a designer annotates a printout.
 * The words write on from left to right, then the arrow draws.
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
  const ref = useReveal<HTMLElement>();
  const sizeCls = size === "lg" ? "text-[2rem] sm:text-[2.3rem]" : size === "sm" ? "text-[1.3rem]" : "text-[1.55rem] sm:text-[1.75rem]";
  const toneCls = tone === "ink" ? "text-ink" : "text-gold-deep";
  const words = (
    <span className={cx("inline-block whitespace-nowrap", load ? "load-write" : "rv-write")} style={{ "--rv-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </span>
  );
  const arrowEl = arrow ? (
    <HandArrow
      kind={arrow}
      load={load}
      tone={tone}
      strokeDelay={delay + 650}
      className={cx("w-[72px] shrink-0 sm:w-[88px]", arrowClassName)}
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
