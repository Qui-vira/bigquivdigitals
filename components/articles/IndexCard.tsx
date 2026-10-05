"use client";

import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { PaperClip, Pin, Sticker, Tape, cx, useReveal } from "@/components/ui-paper";

type Attach = "tape" | "pin" | "clip" | "tape-corners" | "none";

export interface IndexCardProps {
  href: string;
  title: string;
  keyword: string | null;
  from: string | null;
  views: number | null;
  tilt: number;
  attach: Attach;
  stickerTone: "gold" | "tint" | "soft";
  featured?: boolean;
  delay?: number;
}

/**
 * One article, filed as a ruled index card: the category slapped on as a
 * sticker, the title written on the ruled lines, something holding it to the
 * board. The whole card is the link.
 *
 * The ruled lines are 28px apart and every line of text on the card sits on a
 * 28px (or 56px) line-height, so the words land on the rules the way a hand
 * would write them.
 *
 * Entrance: drops onto the board when scrolled into view (useReveal, armed
 * only below the fold, never hides content). Hover: lifts and straightens.
 */
export function IndexCard({
  href,
  title,
  keyword,
  from,
  views,
  tilt,
  attach,
  stickerTone,
  featured = false,
  delay = 0,
}: IndexCardProps) {
  const ref = useReveal<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      href={href}
      className={cx(
        "group rv-drop relative block h-full [rotate:var(--tilt)]",
        "transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-1.5 hover:[rotate:0deg] focus-visible:[rotate:0deg]"
      )}
      style={{ "--tilt": `${tilt}deg`, "--rv-delay": `${delay}ms` } as React.CSSProperties}
    >
      <article className="relative flex h-full flex-col border-[3px] border-ink bg-paper shadow-brutal transition-shadow duration-300 group-hover:shadow-brutal-lg">
        {attach === "tape" && <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-3} />}
        {attach === "tape-corners" && (
          <>
            <Tape className="-left-6 -top-2" tilt={-38} width={86} />
            <Tape className="-right-6 -top-2" tilt={38} width={86} />
          </>
        )}
        {attach === "pin" && <Pin className="-top-3 left-1/2 -translate-x-1/2" />}
        {attach === "clip" && <PaperClip className="-top-7 right-8" />}

        {/* Card head: the category sticker and the go arrow, above the
            gold rule an index card carries across its top. */}
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-gold px-5 pb-4 pt-6 sm:px-6">
          {keyword ? (
            <Sticker shape="label" tone={stickerTone} tilt={-2} decorative={false} reveal={false} textClassName="max-w-[22ch] truncate">
              {keyword}
            </Sticker>
          ) : (
            <span />
          )}
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-paper transition-colors duration-200 group-hover:bg-gold"
          >
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
          </span>
        </div>

        {/* Ruled body. */}
        <div
          className={cx("flex flex-1 flex-col px-5 pb-6 pt-[14px] sm:px-6", featured ? "min-h-[168px] sm:min-h-[224px]" : "min-h-[112px] sm:min-h-[168px]")}
          style={{
            backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 27px, var(--color-grid-line) 27px 28px)",
            backgroundPosition: "0 14px",
          }}
        >
          <h2
            className={cx(
              "text-ink text-balance",
              featured
                ? "font-didone text-[clamp(2rem,3.4vw,2.6rem)] font-semibold leading-[56px] tracking-[-0.005em]"
                : "font-display text-[1.25rem] font-bold leading-[28px] tracking-[-0.012em]"
            )}
          >
            {title}
          </h2>
          {from && (
            <p className="mt-[28px] font-typewriter text-[13px] leading-[28px] text-ink-muted">From: {from}</p>
          )}
          {views != null && views > 0 && (
            <p className="mt-auto flex items-center gap-1.5 pt-[28px] font-typewriter text-[12px] leading-[28px] text-ink-muted">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{views} views</span>
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
