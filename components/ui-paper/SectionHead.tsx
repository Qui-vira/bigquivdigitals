import { cx } from "./cx";

/**
 * Section heading: an optional boxed index number, the title in the condensed
 * Didone, an optional typewriter kicker under it.
 *
 *   <SectionHead index="02" id="work-h" title="Three builds. Go and check them." />
 *
 * Numbering is a brutalist index, not decoration: number the sections of ONE
 * page in order, and skip it on a section that already carries its own
 * numbered list (a process, a sequence). The kicker is optional and should be
 * rare; a title alone is usually enough.
 */
export function SectionHead({
  as: Tag = "h2",
  index,
  indexTone = "gold",
  title,
  kicker,
  size = "lg",
  align = "left",
  id,
  className,
  titleClassName,
}: {
  as?: "h1" | "h2" | "h3";
  index?: string;
  /** Fill of the index box. Use "paper" when the head sits on a gold panel. */
  indexTone?: "gold" | "paper";
  title: React.ReactNode;
  kicker?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  align?: "left" | "center";
  id?: string;
  className?: string;
  titleClassName?: string;
}) {
  const sizeCls =
    size === "xl"
      ? "text-[clamp(3rem,9vw,6rem)]"
      : size === "md"
        ? "text-[clamp(2.25rem,4.6vw,3.5rem)]"
        : "text-[clamp(2.6rem,6.4vw,4.75rem)]";
  return (
    <div className={cx("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      <div className={cx("flex items-start gap-3 sm:gap-4", align === "center" && "justify-center")}>
        {index ? (
          <span
            aria-hidden="true"
            className={cx(
              "mt-[0.35em] inline-flex h-9 shrink-0 items-center border-[3px] border-ink px-1.5",
              indexTone === "paper" ? "bg-paper" : "bg-gold",
              " font-typewriter text-[13px] font-bold tracking-[0.04em] text-ink shadow-brutal-sm sm:h-10 sm:text-sm"
            )}
          >
            ({index})
          </span>
        ) : null}
        <Tag
          id={id}
          className={cx(
            "font-didone font-semibold leading-[0.98] tracking-[-0.005em] text-ink text-balance",
            sizeCls,
            titleClassName
          )}
        >
          {title}
        </Tag>
      </div>
      {kicker ? (
        <p className="max-w-[60ch] font-typewriter text-[14px] leading-relaxed text-ink-soft">{kicker}</p>
      ) : null}
    </div>
  );
}
