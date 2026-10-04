"use client";

import { cx, positioned } from "./cx";
import { useReveal } from "./useReveal";
import { PaperClip, Pin, Tape } from "./Attachments";

type Attach = "tape" | "tape-corners" | "clip" | "pin" | "none";

/**
 * A printed photo stuck to the page: white mat, 3px ink frame, hard shadow,
 * a tilt, and something holding it on.
 *
 *   <PhotoPrint tilt={-2} attach="tape" caption="the first build" lift="group">
 *     <Image src=... fill className="object-cover" />    // inside an aspect box
 *   </PhotoPrint>
 *
 * The child is the photo window. Give it a sized box (aspect-[4/3] etc.); the
 * window clips it and draws its own thin ink rule.
 *
 * lift: "self" lifts and straightens on its own hover, "group" on the hover of
 * the nearest `group` ancestor (use that when the whole card is a link), or
 * "none". Hover only applies on devices that can hover.
 *
 * The tilt is a CSS variable, not inline `rotate`, so hover can straighten it.
 */
export function PhotoPrint({
  tilt = 0,
  attach = "tape",
  mat = "polaroid",
  caption,
  lift = "none",
  reveal = true,
  delay = 0,
  className,
  windowClassName,
  children,
}: {
  tilt?: number;
  attach?: Attach;
  /** "polaroid" leaves a deep bottom margin for a caption, "even" is equal all round. */
  mat?: "polaroid" | "even" | "thin";
  /** Handwritten caption in the bottom margin. Keep it short. */
  caption?: React.ReactNode;
  lift?: "self" | "group" | "none";
  reveal?: boolean;
  /** Reveal delay in ms, for staggering a set of prints. */
  delay?: number;
  className?: string;
  windowClassName?: string;
  children: React.ReactNode;
}) {
  const ref = useReveal<HTMLElement>();
  const matPad =
    mat === "thin" ? "p-1.5" : mat === "even" ? "p-2.5 sm:p-3.5" : "p-2.5 pb-3 sm:p-3.5 sm:pb-4";

  const liftCls =
    lift === "self"
      ? "hover:[rotate:0deg] hover:-translate-y-1.5 hover:shadow-brutal-lg"
      : lift === "group"
        ? "group-hover:[rotate:0deg] group-hover:-translate-y-1.5 group-hover:shadow-brutal-lg group-focus-visible:[rotate:0deg] group-focus-visible:-translate-y-1.5"
        : "";

  return (
    <figure
      ref={ref}
      className={cx(
        positioned(className),
        "m-0 border-[3px] border-ink bg-paper shadow-brutal [rotate:var(--tilt)]",
        "transition-[rotate,translate,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        reveal && "rv-drop",
        matPad,
        liftCls,
        className
      )}
      style={{ "--tilt": `${tilt}deg`, "--rv-delay": `${delay}ms` } as React.CSSProperties}
    >
      <div className={cx("relative overflow-hidden border-2 border-ink bg-paper-alt", windowClassName)}>{children}</div>
      {caption ? (
        <figcaption className="px-1 pt-2.5 font-hand text-[1.45rem] leading-tight text-ink sm:text-[1.6rem]">
          {caption}
        </figcaption>
      ) : null}

      {attach === "tape" && <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-3} />}
      {attach === "tape-corners" && (
        <>
          <Tape className="-left-6 -top-2" tilt={-38} width={86} />
          <Tape className="-right-6 -top-2" tilt={38} width={86} />
        </>
      )}
      {attach === "clip" && <PaperClip className="-top-7 left-8" />}
      {attach === "pin" && <Pin className="-top-3 left-1/2 -translate-x-1/2" />}
    </figure>
  );
}
