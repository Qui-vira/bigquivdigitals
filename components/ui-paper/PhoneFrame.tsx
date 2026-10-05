"use client";

import { cx, positioned } from "./cx";
import { useReveal } from "./useReveal";

/**
 * A phone, drawn as an object lying on the paper: graphite body, a thin
 * metal rim, side buttons, the island, a 9:16 screen, and a hard ink shadow
 * like every other object on the page. The bezel is dark because it is a
 * device; the page around it stays light (README rule 1).
 *
 *   <PhoneFrame label="VestaScan AI ad" tilt={-2} lift="group">
 *     <video className="absolute inset-0 h-full w-full object-cover" ... />
 *   </PhoneFrame>
 *
 * The child is the SCREEN. It sits in a positioned 9:16 box that clips to the
 * screen's corners, so give it `absolute inset-0` (or a `fill` next/image).
 * The island is drawn above the child, the way it sits over a real screen.
 *
 * `label` is the typewriter caption under the phone, the "Beauty" / "Perfume"
 * line in the reference deck. Keep it short; it is rendered as real text.
 *
 * Width comes from className (default `w-full max-w-[280px]`). Everything
 * inside scales from it, so one phone works at 180px and at 320px.
 *
 * Tilt is a CSS variable so `lift` can straighten it on hover, the same
 * mechanism PhotoPrint uses. Never put something that measures itself with
 * getBoundingClientRect inside a tilted phone (see PhotoPrint's note).
 */
export function PhoneFrame({
  label,
  tilt = 0,
  lift = "none",
  reveal = true,
  delay = 0,
  className,
  screenClassName,
  children,
}: {
  label?: React.ReactNode;
  tilt?: number;
  /** "self" lifts on its own hover, "group" on the nearest `group` ancestor's. */
  lift?: "self" | "group" | "none";
  reveal?: boolean;
  /** Reveal delay in ms, for staggering a row of phones. */
  delay?: number;
  className?: string;
  screenClassName?: string;
  children: React.ReactNode;
}) {
  const ref = useReveal<HTMLDivElement>();
  const liftCls =
    lift === "self"
      ? "hover:[rotate:0deg] hover:-translate-y-1.5"
      : lift === "group"
        ? "group-hover:[rotate:0deg] group-hover:-translate-y-1.5 group-focus-within:[rotate:0deg]"
        : "";

  return (
    <div
      ref={ref}
      className={cx(positioned(className), "mx-auto w-full max-w-[280px]", reveal && "rv-drop", className)}
      style={{ "--rv-delay": `${delay}ms` } as React.CSSProperties}
    >
      <div
        className={cx(
          "relative [rotate:var(--tilt)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          liftCls
        )}
        style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
      >
        {/* Side buttons sit behind the body so only their outer edge shows. */}
        <span aria-hidden="true" className="absolute -left-[5px] top-[17%] h-[5%] w-[7px] rounded-l-[3px] border-[2px] border-r-0 border-ink bg-[#2a2a2a]" />
        <span aria-hidden="true" className="absolute -left-[5px] top-[25%] h-[9%] w-[7px] rounded-l-[3px] border-[2px] border-r-0 border-ink bg-[#2a2a2a]" />
        <span aria-hidden="true" className="absolute -left-[5px] top-[36%] h-[9%] w-[7px] rounded-l-[3px] border-[2px] border-r-0 border-ink bg-[#2a2a2a]" />
        <span aria-hidden="true" className="absolute -right-[5px] top-[28%] h-[13%] w-[7px] rounded-r-[3px] border-[2px] border-l-0 border-ink bg-[#2a2a2a]" />

        {/* Body: graphite with a lighter rim, ink outline, hard ink shadow. */}
        <div
          className="relative rounded-[13%/6.5%] border-[3px] border-ink p-[3.2%] shadow-[6px_6px_0_0_#111111]"
          style={{
            background: "linear-gradient(145deg, #3b3d40 0%, #1c1d1f 38%, #111214 62%, #2c2e31 100%)",
          }}
        >
          {/* Inner metal rim, a 1px highlight just inside the outline. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3px] rounded-[12.4%/6.2%] border border-white/15"
          />
          <div
            className={cx(
              "relative aspect-[9/16] w-full overflow-hidden rounded-[10.5%/5.9%] bg-black",
              screenClassName
            )}
          >
            {children}
            {/* The island. Above the screen content, like the real thing. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[2.4%] z-[2] h-[4.2%] w-[30%] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10"
            />
          </div>
        </div>
      </div>

      {label ? (
        <p className="mt-5 text-center font-typewriter text-[13px] font-bold uppercase leading-snug tracking-[0.08em] text-ink">
          {label}
        </p>
      ) : null}
    </div>
  );
}
