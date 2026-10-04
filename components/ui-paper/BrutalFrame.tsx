import { cx, positioned } from "./cx";

type Tone = "paper" | "gold" | "tint" | "alt";
type Shadow = "none" | "sm" | "md" | "lg" | "gold";

const TONE: Record<Tone, string> = {
  paper: "bg-paper",
  gold: "bg-gold",
  tint: "bg-gold-tint",
  alt: "bg-paper-alt",
};

const SHADOW: Record<Shadow, string> = {
  none: "",
  sm: "shadow-brutal-sm",
  md: "shadow-brutal",
  lg: "shadow-brutal-lg",
  gold: "shadow-brutal-gold",
};

/**
 * The brutalist container: a 3px ink frame with a hard, unblurred offset
 * shadow. Square corners, always. Use it when a block genuinely needs to read
 * as an object on the page (an offer, a form, a panel). Most content should sit
 * on the paper with no frame at all.
 *
 *   <BrutalFrame tone="gold" shadow="lg" tilt={-1}>...</BrutalFrame>
 *
 * Text on tone="gold" must be ink or ink-soft (8.8:1 / 5.4:1). Never muted.
 */
export function BrutalFrame({
  as: Tag = "div",
  tone = "paper",
  shadow = "md",
  tilt,
  className,
  children,
  ...rest
}: {
  as?: "div" | "article" | "aside" | "figure" | "section" | "li";
  tone?: Tone;
  shadow?: Shadow;
  /** Degrees. Small values only (within +-3) for frames that hold reading text. */
  tilt?: number;
  className?: string;
  children: React.ReactNode;
  id?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      className={cx(positioned(className), "border-[3px] border-ink text-ink", TONE[tone], SHADOW[shadow], className)}
      style={tilt ? { rotate: `${tilt}deg` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
