import { cx } from "./cx";

/**
 * The things that hold paper to the page: tape, a paper clip, a pin.
 * All decorative and aria-hidden. Position them with className (absolute
 * placement is the caller's job; every one of them is `absolute` already).
 */

/** A strip of translucent gold tape with torn, zig-zag ends. */
export function Tape({
  tilt = -4,
  width = 104,
  className,
}: {
  tilt?: number;
  width?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("pointer-events-none absolute z-[5] block h-[26px] mix-blend-multiply", className)}
      style={{
        width,
        rotate: `${tilt}deg`,
        background:
          "linear-gradient(180deg, rgba(240,180,87,0.62), rgba(231,187,136,0.55)), repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)",
        clipPath:
          "polygon(0 8%, 4% 0, 8% 10%, 12% 0, 88% 0, 92% 10%, 96% 0, 100% 8%, 97% 50%, 100% 92%, 96% 100%, 92% 90%, 88% 100%, 12% 100%, 8% 90%, 4% 100%, 0 92%, 3% 50%)",
      }}
    />
  );
}

/** A silver paper clip, drawn as one stroke with a lighter highlight inside. */
export function PaperClip({ className, tilt = 8 }: { className?: string; tilt?: number }) {
  const d = "M10 20 V50 A5 5 0 0 0 20 50 V12 A8 8 0 0 0 4 12 V54 A11 11 0 0 0 26 54 V24";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 30 68"
      className={cx("pointer-events-none absolute z-[5] h-[68px] w-[30px] overflow-visible", className)}
      style={{ rotate: `${tilt}deg` }}
      fill="none"
      strokeLinecap="round"
    >
      <path d={d} stroke="#111111" strokeWidth="3.2" />
      <path d={d} stroke="#C9CDD2" strokeWidth="1.2" />
    </svg>
  );
}

/** A gold push pin seen from above, with a hard ink shadow. */
export function Pin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute z-[5] block h-[22px] w-[22px] rounded-full border-[3px] border-ink bg-gold shadow-brutal-sm",
        className
      )}
    >
      <span className="absolute left-[3px] top-[3px] block h-[6px] w-[6px] rounded-full bg-paper/80" />
    </span>
  );
}
