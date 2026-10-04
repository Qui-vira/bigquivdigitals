import { cx } from "./cx";
import { CheckerStrip } from "./CheckerStrip";

type Ground = "paper" | "grid" | "alt";
type Width = "wide" | "text" | "mid" | "full";
type Pad = "none" | "sm" | "md" | "lg";

const GROUND: Record<Ground, string> = {
  paper: "bg-paper",
  grid: "bg-grid-paper",
  alt: "bg-paper-alt",
};

const WIDTH: Record<Width, string> = {
  wide: "max-w-[1320px]",
  mid: "max-w-[1080px]",
  text: "max-w-[820px]",
  full: "max-w-none",
};

const PAD: Record<Pad, string> = {
  none: "",
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-20 md:py-32",
};

/**
 * A page band on the paper system. Light grounds only: white, grid paper, or
 * the cool alt grey. There is deliberately no dark option.
 *
 *   <PaperSection ground="grid" checker="top" aria-labelledby="work-h">...</PaperSection>
 *
 * `overflow-x-clip` keeps tilted prints, stamps and stickers that hang past the
 * edge from creating a sideways scroll at 375px. It is `clip`, not `hidden`,
 * so it does not create a scroll container and sticky children keep working.
 *
 * `paper-scope` turns on the shared focus ring and selection colour for
 * everything inside, so pages never restyle focus per component.
 */
export function PaperSection({
  as: Tag = "section",
  ground = "paper",
  width = "wide",
  pad = "md",
  checker,
  id,
  className,
  innerClassName,
  children,
  ...rest
}: {
  as?: "section" | "div" | "header" | "footer" | "aside";
  ground?: Ground;
  width?: Width;
  pad?: Pad;
  /** Checker strip on the top edge, bottom edge, or both. */
  checker?: "top" | "bottom" | "both";
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag id={id} className={cx("paper-scope relative isolate overflow-x-clip text-ink", GROUND[ground], className)} {...rest}>
      {(checker === "top" || checker === "both") && <CheckerStrip />}
      <div className={cx("mx-auto w-full px-4 sm:px-6 lg:px-10", WIDTH[width], PAD[pad], innerClassName)}>
        {children}
      </div>
      {(checker === "bottom" || checker === "both") && <CheckerStrip />}
    </Tag>
  );
}
