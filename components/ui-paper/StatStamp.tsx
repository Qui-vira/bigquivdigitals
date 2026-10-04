"use client";

import { cx, positioned } from "./cx";
import { useReveal } from "./useReveal";

/**
 * A proof number as a stamped ticket: big Didone figure, typewriter label,
 * ink frame, hard shadow, a tilt, perforated edge. For numbers that have a
 * receipt behind them, and ONLY those. The site's claim register applies: if
 * nobody can point at the screenshot, the number does not get a stamp.
 *
 *   <StatStamp value="3,485" label="Subscribers on a channel I built" tone="gold" tilt={-2} />
 *
 * The value is rendered as given, as static text. There is no count-up: one
 * shipped "0+" to real visitors twice, on a page arguing the numbers are real.
 */
export function StatStamp({
  value,
  label,
  tone = "paper",
  tilt = 0,
  delay = 0,
  className,
}: {
  value: string;
  label: string;
  tone?: "paper" | "gold" | "tint";
  tilt?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>();
  const bg = tone === "gold" ? "bg-gold" : tone === "tint" ? "bg-gold-tint" : "bg-paper";
  return (
    <div
      ref={ref}
      className={cx("rv-settle border-[3px]", positioned(className), " border-ink shadow-brutal", bg, className)}
      style={{ rotate: `${tilt}deg`, "--rv-delay": `${delay}ms` } as React.CSSProperties}
    >
      {/* perforation along the top edge, like a torn-off ticket */}
      <span
        aria-hidden="true"
        className="absolute inset-x-3 top-2 h-[3px]"
        style={{ background: "radial-gradient(circle, #111111 1.2px, transparent 1.6px) 0 0 / 9px 3px repeat-x" }}
      />
      <div className="px-5 pb-5 pt-7 sm:px-6">
        <div className="font-didone text-[clamp(3.1rem,5.2vw,4.4rem)] font-semibold leading-[0.9] tracking-[-0.01em] text-ink tabular-nums">
          {value}
        </div>
        <div className="mt-3 border-t-2 border-dashed border-ink/60 pt-3 font-typewriter text-[13px] font-bold uppercase leading-snug tracking-[0.06em] text-ink">
          {label}
        </div>
      </div>
    </div>
  );
}
