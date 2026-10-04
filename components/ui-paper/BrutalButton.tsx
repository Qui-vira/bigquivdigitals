import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cx } from "./cx";

type Variant = "gold" | "paper" | "ink";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  // Ink on gold 8.8:1. Hover goes lighter, never to a gradient.
  gold: "bg-gold text-ink hover:bg-gold-hover",
  paper: "bg-paper text-ink hover:bg-gold-tint",
  // Paper on ink 18.9:1, gold shadow so it still reads as a brand control.
  ink: "bg-ink text-paper hover:bg-[#262626]",
};

/** Shadow depth scales with the button: a nav-sized control gets a 3px step. */
function shadowFor(variant: Variant, size: Size) {
  const c = variant === "ink" ? "#E8A33D" : "#111111";
  if (size === "sm") {
    return variant === "ink"
      ? "shadow-[3px_3px_0_0_#E8A33D] hover:shadow-[5px_5px_0_0_#E8A33D] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_#E8A33D]"
      : "shadow-brutal-sm hover:shadow-[5px_5px_0_0_#111111] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_#111111]";
  }
  return c === "#E8A33D"
    ? "shadow-brutal-gold hover:shadow-[8px_8px_0_0_#E8A33D] active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#E8A33D]"
    : "shadow-brutal hover:shadow-[8px_8px_0_0_#111111] active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#111111]";
}

const SIZE: Record<Size, string> = {
  sm: "min-h-[42px] gap-1.5 px-4 text-[15px]",
  md: "min-h-[52px] gap-2 px-6 text-base",
  lg: "min-h-[60px] gap-2.5 px-7 text-lg",
};

/**
 * The paper system's button: square, 3px ink frame, hard offset shadow, ink
 * label on gold. Hover lifts it towards you (shadow grows), press pushes it
 * into the page (shadow collapses). No sheen, no glow, no pulse.
 *
 *   <BrutalButton href="/greatwork-waitlist">Join the waitlist</BrutalButton>
 *   <BrutalButton href={calendlyUrl} variant="paper">Book a call</BrutalButton>
 *   <BrutalButton onClick={open} arrow={false}>Pay now</BrutalButton>   // client parents only
 *
 * Internal hrefs (starting with "/") use next/link. http(s) hrefs render a
 * plain <a> with the up-right arrow; they open in the same tab unless
 * `newTab` is set. Labels must fit one line at desktop: three words or fewer.
 */
export function BrutalButton({
  href,
  onClick,
  type = "button",
  variant = "gold",
  size = "md",
  arrow = true,
  newTab = false,
  disabled,
  className,
  children,
  ...aria
}: {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  newTab?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const external = !!href && /^https?:\/\//.test(href);
  const Icon = external ? ArrowUpRight : ArrowRight;
  const cls = cx(
    "paper-focus group/btn relative inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap",
    "border-[3px] border-ink font-display font-bold tracking-[-0.005em]",
    "transition-[translate,box-shadow,background-color] duration-150 ease-out",
    "hover:-translate-x-[2px] hover:-translate-y-[2px]",
    shadowFor(variant, size),
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    className
  );
  const inner = (
    <>
      <span>{children}</span>
      {arrow ? (
        <Icon
          aria-hidden="true"
          strokeWidth={2.5}
          className="h-[1.1em] w-[1.1em] transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5"
        />
      ) : null}
    </>
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          className={cls}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...aria}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...aria}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} {...aria}>
      {inner}
    </button>
  );
}
