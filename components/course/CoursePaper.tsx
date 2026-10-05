import { cx } from "@/components/ui-paper/cx";
import { Tape } from "@/components/ui-paper/Attachments";

/**
 * Paper pieces shared by the two course sales pages (/greatwork and
 * /aimastery). Added 2026-10-05 in the paper redesign. Nothing here holds
 * state or copy of its own: every word arrives from the page, so the pages
 * keep owning their claims.
 */

/**
 * The price, as it sits next to a buy button: the old price struck through,
 * the live price in ink, then whatever the page says after it.
 *
 *   <PriceLine was="₦35,000" now="₦15,000">while it is being built · lifetime access</PriceLine>
 */
export function PriceLine({
  was,
  now,
  children,
  className,
}: {
  was: string;
  now: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cx("font-typewriter text-[14px] leading-relaxed text-ink-soft sm:text-[15px]", className)}>
      <span className="relative inline-block text-ink-muted">
        {was}
        <span aria-hidden="true" className="absolute inset-x-[-3px] top-1/2 h-[2px] -rotate-6 bg-ink" />
        <span className="sr-only"> (was)</span>
      </span>{" "}
      <span className="font-bold text-ink">{now}</span> {children}
    </p>
  );
}

/**
 * The price as an object: a gold ticket with a perforated top edge, the old
 * price struck in pen, the live price set big. The buy button goes in as
 * children. Text on it is ink only (8.8:1 on gold).
 */
export function PriceTicket({
  caption,
  was,
  now,
  tilt = -1.5,
  className,
  children,
}: {
  caption: string;
  was: string;
  now: string;
  tilt?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cx("relative border-[3px] border-ink bg-gold p-6 pt-9 shadow-brutal-lg sm:p-8 sm:pt-10", className)}
      style={{ rotate: `${tilt}deg` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-4 top-3 h-[3px]"
        style={{ background: "radial-gradient(circle, #111111 1.2px, transparent 1.6px) 0 0 / 9px 3px repeat-x" }}
      />
      <Tape className="-top-3.5 right-8" tilt={6} width={88} />
      <p className="font-typewriter text-[13px] font-bold uppercase tracking-[0.1em] text-ink">{caption}</p>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="relative inline-block font-didone text-[2rem] font-semibold leading-none text-ink-soft">
          {was}
          <span aria-hidden="true" className="absolute inset-x-[-4px] top-[52%] h-[3px] -rotate-[8deg] bg-ink" />
          <span className="sr-only"> (was)</span>
        </span>
        <span className="font-didone text-[clamp(3.6rem,9vw,5rem)] font-semibold leading-[0.9] tracking-[-0.01em] text-ink tabular-nums">
          {now}
        </span>
      </p>
      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  );
}

type Mark = "arrow" | "check" | "cross";

const MARK: Record<Mark, { glyph: string; cls: string }> = {
  arrow: { glyph: "→", cls: "text-gold-deep" },
  check: { glyph: "✓", cls: "text-gold-deep" },
  cross: { glyph: "✕", cls: "text-ink" },
};

/**
 * A list with a typewriter marker per line. `tone="muted"` for the
 * "not for" lists, which read one step quieter than the "for" lists.
 */
export function MarkList({
  items,
  mark = "arrow",
  tone = "soft",
  className,
}: {
  items: string[];
  mark?: Mark;
  tone?: "ink" | "soft" | "muted";
  className?: string;
}) {
  const m = MARK[mark];
  const toneCls = tone === "ink" ? "text-ink" : tone === "muted" ? "text-ink-muted" : "text-ink-soft";
  return (
    <ul className={cx("space-y-4", className)}>
      {items.map((item) => (
        <li key={item} className={cx("grid grid-cols-[1.5rem_1fr] gap-3 text-[1.0625rem] leading-relaxed", toneCls)}>
          <span aria-hidden="true" className={cx("pt-px font-typewriter text-lg font-bold leading-[1.6]", m.cls)}>
            {m.glyph}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
