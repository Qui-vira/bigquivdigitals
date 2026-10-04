"use client";

import { cx, display, positioned } from "./cx";
import { useReveal } from "./useReveal";

type Shape = "starburst" | "wavy" | "circle" | "label";
type Tone = "gold" | "soft" | "tint" | "paper" | "ink";

const FILL: Record<Tone, string> = {
  gold: "#E8A33D",
  soft: "#E7BB88",
  tint: "#FBEBCF",
  paper: "#FFFFFF",
  ink: "#111111",
};

/** Points of an N-spike star in a 100x100 box. */
function starPoints(spikes: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 48 : 48 * inner;
    // Small deterministic wobble so the burst looks cut, not computed.
    const wobble = i % 2 === 0 ? (i % 4 === 0 ? 0 : -2.2) : 0;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(50 + (r + wobble) * Math.cos(a)).toFixed(2)},${(50 + (r + wobble) * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/**
 * Outline of `bumps` overlapping circles in a row: the scalloped "cloud pill"
 * sticker. Circles have radius r, centres `step` apart (step < 2r).
 */
function wavyPath(bumps: number, r = 20, step = 30) {
  const h = Math.sqrt(r * r - (step / 2) * (step / 2));
  const w = 2 * r + (bumps - 1) * step;
  const cx = (i: number) => r + i * step;
  let d = `M0 ${r}`;
  // top edge, left to right
  for (let i = 0; i < bumps - 1; i++) {
    d += ` A${r} ${r} 0 0 1 ${cx(i) + step / 2} ${r - h}`;
  }
  // last circle, over the right end and down to the bottom intersection
  d += ` A${r} ${r} 0 1 1 ${cx(bumps - 2) + step / 2} ${r + h}`;
  // bottom edge, right to left
  for (let i = bumps - 2; i > 0; i--) {
    d += ` A${r} ${r} 0 0 1 ${cx(i - 1) + step / 2} ${r + h}`;
  }
  d += ` A${r} ${r} 0 0 1 0 ${r} Z`;
  return { d, w, h: 2 * r };
}

/**
 * Stickers slapped onto the page. Tiny typewriter text in a shape, rotated a
 * few degrees, settling on with a small overshoot when scrolled into view.
 *
 *   <Sticker shape="starburst" tone="gold" size={120} tilt={12}>new</Sticker>
 *   <Sticker shape="wavy" tone="soft" tilt={-8}>my work</Sticker>
 *   <Sticker shape="circle" tone="paper" size={96}>since day one</Sticker>
 *   <Sticker shape="label" tone="ink">Spec ad</Sticker>
 *
 * Decorative by default (aria-hidden). Pass `decorative={false}` when the text
 * carries meaning a screen reader should hear, such as a category tag.
 * Every sticker word is a label, never a claim: if it states a fact, it needs
 * the same proof as any other number on the site.
 */
export function Sticker({
  shape = "starburst",
  tone = "gold",
  size = 112,
  tilt = -6,
  bumps = 4,
  decorative = true,
  reveal = true,
  delay = 0,
  className,
  textClassName,
  children,
}: {
  shape?: Shape;
  tone?: Tone;
  /** Width of a starburst/circle in px, or height of a wavy pill. Labels size to text. */
  size?: number;
  tilt?: number;
  /** Wavy pill only: number of scallops. */
  bumps?: number;
  decorative?: boolean;
  reveal?: boolean;
  delay?: number;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}) {
  const ref = useReveal<HTMLSpanElement>();
  const fill = FILL[tone];
  const textTone = tone === "ink" ? "text-paper" : "text-ink";
  const common = cx(
    positioned(className),
    display(className, "inline-flex"),
    "select-none items-center justify-center",
    reveal && "rv-settle",
    className
  );
  const style = { rotate: `${tilt}deg`, "--rv-delay": `${delay}ms` } as React.CSSProperties;
  const text = children ? (
    <span
      className={cx(
        "relative z-[1] px-2 text-center font-typewriter text-[12px] font-bold uppercase leading-[1.15] tracking-[0.06em]",
        textTone,
        textClassName
      )}
    >
      {children}
    </span>
  ) : null;

  if (shape === "label") {
    return (
      <span
        ref={ref}
        aria-hidden={decorative || undefined}
        className={cx(common, "border-[3px] border-ink px-2.5 py-1 shadow-brutal-sm")}
        style={{ ...style, background: fill }}
      >
        {text}
      </span>
    );
  }

  if (shape === "circle") {
    return (
      <span
        ref={ref}
        aria-hidden={decorative || undefined}
        className={cx(common, "rounded-full border-[3px] border-ink shadow-brutal-sm")}
        style={{ ...style, width: size, height: size, background: fill }}
      >
        <span aria-hidden="true" className="absolute inset-[5px] rounded-full border-[1.5px] border-dashed border-ink/70" />
        {text}
      </span>
    );
  }

  if (shape === "wavy") {
    const { d, w, h } = wavyPath(bumps);
    const width = (size * w) / h;
    return (
      <span
        ref={ref}
        aria-hidden={decorative || undefined}
        className={common}
        style={{ ...style, width, height: size }}
      >
        <svg aria-hidden="true" viewBox={`-2 -2 ${w + 4} ${h + 4}`} className="absolute inset-0 h-full w-full overflow-visible">
          <path d={d} transform="translate(2.5 2.5)" fill="#111111" />
          <path d={d} fill={fill} stroke="#111111" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
        {text}
      </span>
    );
  }

  // starburst
  return (
    <span
      ref={ref}
      aria-hidden={decorative || undefined}
      className={common}
      style={{ ...style, width: size, height: size }}
    >
      <svg aria-hidden="true" viewBox="-2 -2 104 104" className="absolute inset-0 h-full w-full overflow-visible">
        <polygon points={starPoints(14, 0.74)} transform="translate(2.5 2.5)" fill="#111111" />
        <polygon points={starPoints(14, 0.74)} fill={fill} stroke="#111111" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
      {text}
    </span>
  );
}
